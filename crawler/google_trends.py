"""
Google Trends Crawler - The Info Club v2.0
pytrends를 사용하여 유튜버 관련 키워드의 검색 트렌드를 수집합니다.
"""
import os
import requests
import json
from dotenv import load_dotenv
from datetime import datetime, date
import time as time_module

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 유튜버에게 중요한 시드 키워드 (카테고리별)
SEED_KEYWORDS = {
    "콘텐츠 트렌드": ["유튜브 쇼츠", "브이로그", "먹방", "ASMR", "언박싱"],
    "플랫폼 트렌드": ["유튜브", "틱톡", "인스타 릴스", "트위치", "AI 영상"],
    "크리에이터 도구": ["영상 편집", "썸네일", "자막 생성", "AI 더빙", "SEO"],
    "인기 주제": ["게임", "K-POP", "여행 브이로그", "재테크", "자기계발"],
}


def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }


def fetch_keyword_trends(keywords, category_name, geo="KR"):
    """
    pytrends interest_over_time으로 키워드 트렌드를 분석합니다.
    
    Args:
        keywords: 분석할 키워드 리스트 (최대 5개)
        category_name: 키워드 카테고리 이름
        geo: 국가 코드
    
    Returns:
        list of keyword trend dicts
    """
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl='ko', tz=540)
        pytrends.build_payload(keywords[:5], timeframe='now 7-d', geo=geo)
        
        df = pytrends.interest_over_time()
        
        if df.empty:
            print(f"    ⚠️ '{category_name}' 카테고리 데이터 없음")
            return []

        results = []
        for keyword in keywords[:5]:
            if keyword not in df.columns:
                continue
            
            avg_interest = int(df[keyword].mean())
            max_interest = int(df[keyword].max())
            latest = int(df[keyword].iloc[-1])
            
            # 트렌드 방향 판단: 최근 vs 평균
            if latest > avg_interest * 1.3:
                trend_direction = "📈 급상승"
            elif latest > avg_interest:
                trend_direction = "↗️ 상승"
            elif latest < avg_interest * 0.7:
                trend_direction = "📉 하락"
            else:
                trend_direction = "→ 보합"
            
            traffic_info = f"{trend_direction} (현재:{latest}, 평균:{avg_interest}, 최고:{max_interest})"
            
            results.append({
                "keyword": keyword,
                "region": "KR" if geo == "KR" else "US",
                "traffic_volume": traffic_info,
                "related_topics": category_name,
                "trending_date": date.today().isoformat(),
                "crawled_at": datetime.now().isoformat()
            })

        print(f"    ✅ '{category_name}': {len(results)}개 키워드 분석 완료")
        return results

    except Exception as e:
        print(f"    ❌ Trends Error ({category_name}): {e}")
        return []


def fetch_related_queries(seed_keywords, geo="KR"):
    """특정 키워드의 관련 검색어를 가져옵니다."""
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl='ko', tz=540)
        pytrends.build_payload(seed_keywords[:5], timeframe='now 7-d', geo=geo)

        related = pytrends.related_queries()
        result = {}

        for keyword, data in related.items():
            top_queries = []
            if data.get("top") is not None and not data["top"].empty:
                top_queries = data["top"]["query"].tolist()[:10]
            result[keyword] = top_queries

        return result

    except Exception as e:
        print(f"    ❌ Related queries error: {e}")
        return {}


def save_to_supabase(keywords):
    """수집한 키워드를 Supabase에 저장합니다."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️ Supabase credentials not set.")
        return

    endpoint = f"{SUPABASE_URL}/rest/v1/google_trends"
    headers = get_supabase_headers()

    saved = 0
    for kw in keywords:
        try:
            # 기존 동일 키워드 + 날짜 데이터 확인 후 upsert
            check_url = f"{SUPABASE_URL}/rest/v1/google_trends?keyword=eq.{kw['keyword']}&trending_date=eq.{kw['trending_date']}&region=eq.{kw['region']}"
            check_resp = requests.get(check_url, headers=get_supabase_headers())
            
            if check_resp.status_code == 200 and len(check_resp.json()) > 0:
                # 업데이트
                existing_id = check_resp.json()[0]['id']
                update_url = f"{SUPABASE_URL}/rest/v1/google_trends?id=eq.{existing_id}"
                resp = requests.patch(update_url, json=kw, headers=headers)
            else:
                # 새로 삽입
                resp = requests.post(endpoint, json=kw, headers=headers)
            
            if resp.status_code in range(200, 300):
                saved += 1
            else:
                pass  # 조용히 넘어감
        except Exception as e:
            print(f"    ❌ Save error: {e}")

    print(f"  💾 {saved}/{len(keywords)}개 저장 완료")


def run_google_trends_crawler():
    """Google Trends 크롤러 실행"""
    print(f"\n[{datetime.now()}] 📊 Google Trends Crawler 시작...")

    all_keywords = []
    
    for category_name, keywords in SEED_KEYWORDS.items():
        print(f"  📍 '{category_name}' 카테고리 분석 중...")
        trends = fetch_keyword_trends(keywords, category_name, geo="KR")
        all_keywords.extend(trends)
        time_module.sleep(2)  # Google rate limit 방지

    # 관련 검색어도 수집 (상위 카테고리 대표 키워드)
    print(f"  🔍 관련 검색어 분석 중...")
    top_keywords = ["유튜브", "쇼츠", "AI"]
    related = fetch_related_queries(top_keywords)
    
    for main_kw, related_list in related.items():
        for rq in related_list[:5]:
            all_keywords.append({
                "keyword": rq,
                "region": "KR",
                "traffic_volume": f"'{main_kw}' 관련 검색어",
                "related_topics": f"{main_kw} 관련",
                "trending_date": date.today().isoformat(),
                "crawled_at": datetime.now().isoformat()
            })

    if all_keywords:
        save_to_supabase(all_keywords)
        
        # 콘솔 미리보기
        print("\n  📊 수집된 키워드 미리보기:")
        for kw in all_keywords[:10]:
            print(f"    • {kw['keyword']}: {kw['traffic_volume']}")
    else:
        print("  ⚠️ 수집된 키워드가 없습니다.")

    print(f"  📊 Google Trends Crawler 완료! (총 {len(all_keywords)}개)\n")
    return all_keywords


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        print("🚀 Google Trends Crawler (단일 실행)...")
        run_google_trends_crawler()
        print("✅ 완료!")
    else:
        print("🚀 Google Trends Crawler (반복 모드, 6시간 간격)")
        while True:
            run_google_trends_crawler()
            print("😴 6시간 대기 중...")
            time_module.sleep(21600)  # 6시간 간격
