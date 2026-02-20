"""
Cross-Platform Trend Analyzer - The Info Club v2.0
Reddit + YouTube + Google Trends 데이터를 교차 분석하여 주간 리포트를 생성합니다.
OpenAI REST API를 requests로 직접 호출 (Python 3.14 호환)
"""
import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime, date, timedelta

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }


def call_openai(system_prompt, user_prompt, max_tokens=1500):
    """OpenAI REST API를 requests로 직접 호출합니다."""
    if not OPENAI_API_KEY:
        print("  ⚠️ OPENAI_API_KEY not set.")
        return None

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"].strip()
        else:
            print(f"  ❌ OpenAI Error: {resp.status_code} - {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"  ❌ OpenAI Exception: {e}")
        return None


def fetch_recent_reddit_posts(days=7):
    """최근 N일간 Reddit 포스트 가져오기"""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    url = f"{SUPABASE_URL}/rest/v1/posts?crawled_at=gte.{since}&select=title,subreddit,ai_insight&order=crawled_at.desc&limit=50"
    resp = requests.get(url, headers=get_supabase_headers())
    if resp.status_code == 200:
        return resp.json()
    return []


def fetch_recent_youtube_trends(days=7):
    """최근 N일간 YouTube 트렌딩 데이터 가져오기"""
    since = date.today() - timedelta(days=days)
    url = f"{SUPABASE_URL}/rest/v1/youtube_trends?trending_date=gte.{since.isoformat()}&select=title,channel_title,category,view_count,region&order=view_count.desc&limit=50"
    resp = requests.get(url, headers=get_supabase_headers())
    if resp.status_code == 200:
        return resp.json()
    return []


def fetch_recent_google_trends(days=7):
    """최근 N일간 Google 트렌드 키워드 가져오기"""
    since = date.today() - timedelta(days=days)
    url = f"{SUPABASE_URL}/rest/v1/google_trends?trending_date=gte.{since.isoformat()}&select=keyword,region,traffic_volume&order=crawled_at.desc&limit=50"
    resp = requests.get(url, headers=get_supabase_headers())
    if resp.status_code == 200:
        return resp.json()
    return []


def generate_weekly_report(reddit_data, youtube_data, google_data):
    """3개 플랫폼 데이터를 종합하여 AI 주간 리포트를 생성합니다."""

    reddit_summary = "\n".join([
        f"- [{p.get('subreddit','')}] {p.get('title','')}"
        for p in reddit_data[:20]
    ]) or "데이터 없음"

    youtube_summary = "\n".join([
        f"- [{v.get('category','')}] {v.get('title','')} ({v.get('channel_title','')}, 조회수: {v.get('view_count',0):,})"
        for v in youtube_data[:20]
    ]) or "데이터 없음"

    google_summary = "\n".join([
        f"- {k.get('keyword','')} ({k.get('region','')}: {k.get('traffic_volume','')})"
        for k in google_data[:30]
    ]) or "데이터 없음"

    system_prompt = "한국 유튜버를 위한 트렌드 분석가입니다. 데이터 기반으로 실행 가능한 인사이트를 제공합니다."

    user_prompt = f"""당신은 한국 유튜버를 위한 트렌드 분석 전문가입니다.
아래 3개 플랫폼에서 수집한 이번 주 데이터를 분석하여, 한국어로 주간 트렌드 리포트를 작성해주세요.

## 📌 Reddit 크리에이터 커뮤니티 핫 토픽
{reddit_summary}

## 📌 YouTube 인기 동영상 (한국 + 미국)
{youtube_summary}

## 📌 Google 검색 트렌드
{google_summary}

---

아래 형식으로 리포트를 작성해주세요:

# 📊 이번 주 크리에이터 트렌드 리포트

## 🔥 HOT 키워드 TOP 5
(3개 플랫폼에서 공통적으로 나타나는 주제/키워드를 뽑아주세요)

## 📺 유튜브 콘텐츠 제안 3가지
(각 제안마다: 주제, 예상 타이틀, 왜 지금 만들어야 하는지)

## 🌏 해외 vs 한국 트렌드 비교
(미국에서는 뜨고 있지만 한국에서는 아직 안 다룬 주제가 있다면)

## ⚡ 이번 주 액션 아이템
(유튜버가 지금 당장 실행할 수 있는 구체적인 행동 3가지)"""

    report = call_openai(system_prompt, user_prompt)

    if report:
        hot_keywords = extract_hot_keywords(report)
        print("  ✨ 주간 리포트 생성 완료!")
        return report, hot_keywords
    return None, None


def extract_hot_keywords(report_text):
    """리포트에서 HOT 키워드를 추출합니다."""
    keywords = []
    in_hot_section = False
    for line in report_text.split("\n"):
        if "HOT 키워드" in line or "HOT" in line.upper():
            in_hot_section = True
            continue
        if in_hot_section:
            if line.startswith("##"):
                break
            cleaned = line.strip().lstrip("0123456789.-) ").strip()
            if cleaned and len(cleaned) > 1:
                cleaned = cleaned.replace("**", "").strip()
                if cleaned:
                    keywords.append(cleaned)
    return keywords[:10]


def save_report_to_supabase(report_content, hot_keywords, sources_summary=None):
    """주간 리포트를 Supabase에 저장합니다."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    data = {
        "week_start": week_start.isoformat(),
        "report_content": report_content,
        "hot_keywords": json.dumps(hot_keywords, ensure_ascii=False),
        "sources_summary": json.dumps(sources_summary or {}, ensure_ascii=False),
        "created_at": datetime.now().isoformat()
    }

    endpoint = f"{SUPABASE_URL}/rest/v1/weekly_reports"
    resp = requests.post(endpoint, json=data, headers=get_supabase_headers())

    if resp.status_code in range(200, 300):
        print(f"  💾 주간 리포트 저장 완료! (주차: {week_start})")
    else:
        print(f"  ❌ 리포트 저장 실패: {resp.status_code} - {resp.text[:200]}")


def run_trend_analysis():
    """전체 교차 분석 파이프라인 실행"""
    print(f"\n[{datetime.now()}] 🧠 Cross-Platform Trend Analysis 시작...")

    print("  📡 데이터 수집 중...")
    reddit_data = fetch_recent_reddit_posts()
    youtube_data = fetch_recent_youtube_trends()
    google_data = fetch_recent_google_trends()

    print(f"  📊 수집 결과: Reddit {len(reddit_data)}개, YouTube {len(youtube_data)}개, Google {len(google_data)}개")

    if not reddit_data and not youtube_data and not google_data:
        print("  ⚠️ 분석할 데이터가 없습니다. 크롤러를 먼저 실행해주세요.")
        return

    print("  🤖 AI 리포트 생성 중...")
    report, hot_keywords = generate_weekly_report(reddit_data, youtube_data, google_data)

    if report:
        sources_summary = {
            "reddit_count": len(reddit_data),
            "youtube_count": len(youtube_data),
            "google_count": len(google_data),
            "analysis_date": datetime.now().isoformat()
        }
        save_report_to_supabase(report, hot_keywords, sources_summary)

        print("\n" + "=" * 60)
        print("📋 주간 리포트 미리보기:")
        print("=" * 60)
        print(report[:800] + "..." if len(report) > 800 else report)
        print("=" * 60)
    else:
        print("  ❌ 리포트 생성에 실패했습니다.")

    print("  🧠 Cross-Platform Trend Analysis 완료!\n")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        print("🚀 Trend Analyzer (단일 실행)...")
        run_trend_analysis()
        print("✅ 완료!")
    else:
        import time
        print("🚀 Trend Analyzer (반복 모드, 24시간 간격)")
        while True:
            run_trend_analysis()
            print("😴 24시간 대기 중...")
            time.sleep(86400)
