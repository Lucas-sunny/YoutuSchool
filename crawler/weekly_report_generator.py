"""
주간 YouTube 트렌드 리포트 생성기
- 실제 수집된 Reddit 포스트만 사용 (할루시네이션 방지)
- GPT-4o로 심층 분석
- 동향/뉴스 TOP 5 + 정책/수익 TOP 5 형식
- 매주 월요일 GitHub Actions로 자동 실행
"""
import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def fetch_weekly_posts():
    """지난 7일간 수집된 Reddit 포스트 가져오기"""
    since = (datetime.utcnow() - timedelta(days=7)).isoformat()
    url = f"{SUPABASE_URL}/rest/v1/posts?created_at=gte.{since}&select=*&limit=200"
    r = requests.get(url, headers=get_headers())
    posts = r.json() if r.status_code == 200 else []
    print(f"[FETCH] 이번 주 수집된 포스트: {len(posts)}개")
    return posts

def format_posts_for_prompt(posts):
    """AI 프롬프트에 넣을 포스트 데이터 구성 (실제 데이터만)"""
    lines = []
    for i, p in enumerate(posts, 1):
        lines.append(f"""
--- 포스트 #{i} ---
서브레딧: r/{p.get('subreddit', '')}
제목: {p.get('title', '')}
내용 요약: {(p.get('content') or '')[:500]}
업데이트: {p.get('upvotes', 0)}
수집일: {p.get('created_at', '')[:10]}
기존 분석: {(p.get('ai_insight') or '')[:300]}
""")
    return "\n".join(lines)

SYSTEM_PROMPT = """당신은 YouTube 크리에이터 전문 리서처입니다.
제공된 Reddit 포스트 데이터를 기반으로 주간 리포트를 작성합니다.

⚠️ 절대 규칙 (할루시네이션 방지):
1. 반드시 아래 제공된 실제 Reddit 포스트 데이터만 사용하세요.
2. 제공되지 않은 정보, 날짜, 수치, 정책명은 절대 추가하지 마세요.
3. 확실하지 않은 정보는 "해당 없음" 또는 생략하세요.
4. 실제 포스트에서 인용할 때는 서브레딧 출처를 명시하세요.

출력 형식 (JSON):
{
  "week_label": "2026년 X월 X주차",
  "generated_at": "ISO 날짜",
  "summary": "이번 주 핵심 1줄 요약",
  "part_a": [
    {
      "rank": 1,
      "keyword": "핵심 키워드",
      "sources": ["r/서브레딧1", "r/서브레딧2"],
      "summary": "핵심 요약 (실제 포스트 내용 기반)",
      "creator_impact": "크리에이터 영향",
      "strategy": "대응 전략",
      "actions": ["실행 액션1", "실행 액션2"]
    }
  ],
  "part_b": [
    (동일 구조)
  ]
}

- part_a: 유튜브 동향 및 뉴스 TOP 5
- part_b: 정책 및 수익창출 TOP 5
- 데이터가 부족해 5개를 채울 수 없으면 있는 만큼만 작성
- 각 항목은 여러 포스트를 종합해 작성 가능"""

def generate_weekly_report(posts):
    """실제 포스트 데이터를 기반으로 주간 리포트 생성"""
    if not posts:
        print("[WARN] 포스트 없음 - 리포트 생성 불가")
        return None

    posts_text = format_posts_for_prompt(posts)
    today = datetime.utcnow()
    week_num = (today.day - 1) // 7 + 1
    week_label = f"{today.year}년 {today.month}월 {week_num}주차"

    user_prompt = f"""아래는 이번 주({week_label}) 실제 수집된 Reddit 포스트 {len(posts)}개입니다.
이 데이터만 사용해 주간 리포트를 작성하세요.
제공된 포스트에 없는 정보는 절대 추가하지 마세요.

=== 실제 수집 데이터 ===
{posts_text}
======================

위 데이터만 기반으로 JSON 형식의 주간 리포트를 작성해주세요."""

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 3000,
        "temperature": 0.2,   # 매우 낮은 온도 = 창의적 추가 최소화
        "response_format": {"type": "json_object"}
    }

    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=60
    )

    if resp.status_code != 200:
        print(f"[ERROR] OpenAI API 오류: {resp.status_code} - {resp.text[:200]}")
        return None

    content = resp.json()["choices"][0]["message"]["content"]
    try:
        report_data = json.loads(content)
        print(f"[OK] 리포트 생성 완료: {report_data.get('week_label')}")
        return report_data
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON 파싱 실패: {e}")
        return None

def save_report_to_db(report_data, post_count):
    """생성된 리포트를 Supabase weekly_reports 테이블에 저장"""
    payload = {
        "week_label": report_data.get("week_label"),
        "summary": report_data.get("summary"),
        "part_a": json.dumps(report_data.get("part_a", []), ensure_ascii=False),
        "part_b": json.dumps(report_data.get("part_b", []), ensure_ascii=False),
        "post_count": post_count,
        "raw_data": json.dumps(report_data, ensure_ascii=False)
    }

    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/weekly_reports",
        headers={**get_headers(), "Prefer": "resolution=merge-duplicates"},
        json=payload
    )

    if r.status_code in (200, 201):
        print(f"[OK] 리포트 DB 저장 완료: {payload['week_label']}")
        return True
    else:
        print(f"[ERROR] DB 저장 실패: {r.status_code} - {r.text[:200]}")
        return False

def main():
    print("=" * 50)
    print("주간 YouTube 트렌드 리포트 생성 시작")
    print("=" * 50)

    # 1. 이번 주 포스트 가져오기
    posts = fetch_weekly_posts()
    if not posts:
        print("[WARN] 이번 주 포스트가 없습니다. 종료.")
        return

    # 2. GPT-4o로 리포트 생성 (실제 데이터만 사용)
    print(f"[AI] {len(posts)}개 포스트를 기반으로 GPT-4o 분석 중...")
    report = generate_weekly_report(posts)
    if not report:
        print("[ERROR] 리포트 생성 실패. 종료.")
        return

    # 3. DB에 저장
    save_report_to_db(report, len(posts))

    print("=" * 50)
    print("주간 리포트 생성 완료!")
    print("=" * 50)

if __name__ == "__main__":
    main()
