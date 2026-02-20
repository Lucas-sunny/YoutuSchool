"""
YouTube Trending Crawler - The Info Club v2.0
YouTube Data API를 사용하여 한국/미국 인기 동영상을 수집합니다.
"""
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, date

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# YouTube 카테고리 ID → 이름 매핑 (주요 카테고리)
CATEGORY_MAP = {
    "1": "영화/애니메이션", "2": "자동차", "10": "음악",
    "15": "동물", "17": "스포츠", "19": "여행/이벤트",
    "20": "게임", "22": "일상/블로그", "23": "코미디",
    "24": "엔터테인먼트", "25": "뉴스/정치", "26": "스타일",
    "27": "교육", "28": "과학/기술", "29": "비영리/사회운동"
}

# 수집 대상 지역
TARGET_REGIONS = ["KR", "US"]


def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }


def fetch_trending_videos(region_code="KR", max_results=25):
    """
    YouTube Data API로 특정 지역의 인기 동영상을 가져옵니다.
    
    Args:
        region_code: 국가 코드 (KR, US 등)
        max_results: 가져올 동영상 수 (최대 50)
    
    Returns:
        list of video data dicts
    """
    if not YOUTUBE_API_KEY:
        print("  ⚠️ YOUTUBE_API_KEY not set, skipping YouTube trending.")
        return []

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,statistics",
        "chart": "mostPopular",
        "regionCode": region_code,
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            print(f"  ❌ YouTube API Error ({region_code}): {response.status_code} - {response.text[:200]}")
            return []

        data = response.json()
        videos = []

        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            category_id = snippet.get("categoryId", "0")

            videos.append({
                "video_id": item["id"],
                "title": snippet.get("title", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "category": CATEGORY_MAP.get(category_id, f"기타({category_id})"),
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "region": region_code,
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "trending_date": date.today().isoformat(),
                "crawled_at": datetime.now().isoformat()
            })

        print(f"  ✅ {region_code}: {len(videos)}개 인기 동영상 수집 완료")
        return videos

    except Exception as e:
        print(f"  ❌ YouTube API Exception ({region_code}): {e}")
        return []


def save_to_supabase(videos):
    """수집한 동영상 데이터를 Supabase에 저장합니다."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️ Supabase credentials not set.")
        return

    endpoint = f"{SUPABASE_URL}/rest/v1/youtube_trends?on_conflict=video_id"
    headers = get_supabase_headers()

    saved = 0
    for video in videos:
        try:
            resp = requests.post(endpoint, json=video, headers=headers)
            if resp.status_code in range(200, 300):
                saved += 1
            else:
                print(f"  ⚠️ Save failed for {video['title'][:30]}: {resp.status_code}")
        except Exception as e:
            print(f"  ❌ Save error: {e}")

    print(f"  💾 {saved}/{len(videos)}개 저장 완료")


def run_youtube_crawler():
    """YouTube 트렌딩 크롤러 실행"""
    print(f"\n[{datetime.now()}] 🎬 YouTube Trending Crawler 시작...")

    all_videos = []
    for region in TARGET_REGIONS:
        print(f"  📍 {region} 지역 인기 동영상 수집 중...")
        videos = fetch_trending_videos(region_code=region)
        all_videos.extend(videos)

    if all_videos:
        save_to_supabase(all_videos)
    else:
        print("  ⚠️ 수집된 동영상이 없습니다.")

    print(f"  🎬 YouTube Trending Crawler 완료! (총 {len(all_videos)}개)\n")
    return all_videos


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        print("🚀 YouTube Trending Crawler (단일 실행)...")
        run_youtube_crawler()
        print("✅ 완료!")
    else:
        import time
        print("🚀 YouTube Trending Crawler (반복 모드, 30분 간격)")
        while True:
            run_youtube_crawler()
            print("😴 30분 대기 중...")
            time.sleep(1800)  # 30분 간격 (API 할당량 절약)
