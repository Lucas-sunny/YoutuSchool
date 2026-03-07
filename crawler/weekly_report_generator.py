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
    """AI 프롬프트에 넣을 포스트 데이터 구성 (댓글 포함 실제 데이터만)"""
    lines = []
    for i, p in enumerate(posts, 1):
        top_comments = p.get('top_comments', [])
        comments_text = ""
        if top_comments and isinstance(top_comments, list):
            for c in top_comments:
                comments_text += f"- [업보트 {c.get('ups', 0)}] {c.get('body', '')[:100]}...\n"
                
        upvotes = p.get('upvotes', 0)
        upvote_ratio = p.get('upvote_ratio', 1.0)
        
        lines.append(f"""
--- 포스트 #{i} ---
서브레딧: r/{p.get('subreddit', '')}
제목: {p.get('title', '')}
내용 요약: {(p.get('content') or '')[:800]}
반응: 업보트 {upvotes}개 (비율: {upvote_ratio*100:.0f}%), 댓글 수 {p.get('comment_count', 0)}개
상위 댓글 반응:
{comments_text if comments_text else "- (수집된 댓글 없음)"}
기존 분석: {(p.get('ai_insight') or '')[:300]}
""")
    return "\n".join(lines)

SYSTEM_PROMPT = """당신은 상위 1% 유튜브 크리에이터 전문 수석 전략 애널리스트입니다.
제공된 Reddit 포스트(본문, 상위 댓글, 통계 지표) 데이터를 기반으로 최고급 인사이트가 담긴 주간 리포트를 작성합니다.

⚠️ 절대 규칙 (고급화 및 차별화 - 가장 중요!!!):
1. 한국 유튜브 생태계에 이미 널리 퍼진 뻔한 정보(예: 일관성 유지해라, 썸네일/제목 어그로 끌어라, 쇼츠 많이 올려라 등)는 철저히 배제하세요.
2. 한국 유튜버들이 아직 잘 모르는 해외 테크 뉴스, 변경된 알고리즘의 구체적 동작 방식/데이터, 글로벌 크리에이터들 사이의 새로운 수익화 꼼수, 플랫폼의 구조적 변화 같은 '비밀스럽고 깊이 있는 고급 정보'만 최우선으로 선별하세요.
3. 정보 가치가 높고 생소할수록 상위권(TOP 1, 2)에 랭크시키세요. 데이터 기반의 Case Study나 A/B 테스트 결과를 특히 우대하세요.
4. 모든 조언은 추상적인 칭찬이 아니라, "데이터를 확인하고 즉각 내 채널에 적용할 수 있는 구체적이고 전문적인 기법(예: 특정 지표 하락 시 알고리즘 회피기동, CPM 방어 전략 등)"으로 작성하세요.
5. 주된 논조는 반드시 수집된 레딧 포스트와 댓글 데이터를 기반으로 하되, 당신의 최고급 도메인 지식을 더해 맥락을 풍부하게 해설하세요.

출력 형식 (JSON):
{
  "week_label": "2026년 X월 X주차",
  "generated_at": "ISO 날짜",
  "summary": "이번 주 가장 파급력이 컸던 고급 인사이트 1줄 요약",
  "part_a": [
    {
      "rank": 1,
      "keyword": "핵심 키워드 (예: 홈피드 알고리즘 파동)",
      "sources": ["r/서브레딧명 (업보트 수, 여론 요약)"],
      "summary": "핵심 요약 (실제 포스트와 댓글 반응 기반의 심층 해설)",
      "creator_impact": "한국 크리에이터에게 체감되는 구체적이고 치명적인 영향 (수익/조회수 직결)",
      "strategy": "위기에 대한 회피 또는 기회 선점 전략 (기획/편집 등 실무적 관점)",
      "actions": ["실행 액션1 (오늘 즉시 점검/실행할 구체적 지침)", "실행 액션2"]
    }
  ],
  "part_b": [
    (동일 구조)
  ]
}

- part_a: 유튜브 동향 및 알고리즘 심층 분석 TOP 5
- part_b: 정책 변화 및 수익창출 극대화 전략 TOP 5
- 데이터가 부족해 5개를 채울 수 없으면 있는 만큼만 심도 있게 작성 (억지로 개수를 채우기 위해 뻔한 내용 넣기 금지)"""

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
        "max_tokens": 4000,
        "temperature": 0.4,   # 창의적 융합을 위해 약간 증가
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
        f"{SUPABASE_URL}/rest/v1/weekly_reports?on_conflict=week_label",
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
