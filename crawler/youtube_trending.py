"""
YouTube Trending Crawler - The Info Club v2.0
YouTube Data API를 사용하여 카테고리별 한국/해외 인기 동영상을 수집합니다.
각 카테고리별로 KR 10개 + US 10개씩 수집합니다.
"""
import os
import requests
from typing import List, Dict
from dotenv import load_dotenv
from datetime import datetime, date

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# YouTube 카테고리 ID → 이름 매핑
CATEGORY_MAP = {
    "1": "영화/애니메이션", "2": "자동차", "10": "음악",
    "15": "동물", "17": "스포츠", "19": "여행/이벤트",
    "20": "게임", "22": "일상/블로그", "23": "코미디",
    "24": "엔터테인먼트", "25": "뉴스/정치", "26": "스타일/뷰티",
    "27": "교육", "28": "과학/기술", "29": "비영리/사회운동"
}

# 수집 대상 카테고리 (다양한 카테고리를 각각 수집)
TARGET_CATEGORIES = [
    {"id": "10", "name": "음악"},
    {"id": "20", "name": "게임"},
    {"id": "24", "name": "엔터테인먼트"},
    {"id": "1",  "name": "영화/애니메이션"},
    {"id": "17", "name": "스포츠"},
    {"id": "22", "name": "일상/블로그"},
    {"id": "23", "name": "코미디"},
    {"id": "25", "name": "뉴스/정치"},
    {"id": "28", "name": "과학/기술"},
    {"id": "27", "name": "교육"},
    {"id": "26", "name": "스타일/뷰티"},
    {"id": "19", "name": "여행/이벤트"},
]

# 수집 대상 지역
TARGET_REGIONS = ["KR", "US"]

# 카테고리별 지역별 수집 수
PER_CATEGORY_PER_REGION = 10


def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }


def fetch_videos_by_category(category_id: str, category_name: str, region_code: str = "KR", max_results: int = 10) -> List[Dict]:
    """
    특정 카테고리 + 지역의 YouTube 인기 동영상을 수집합니다.

    Args:
        category_id: YouTube 카테고리 ID
        category_name: 카테고리 이름 (한글)
        region_code: 국가 코드 (KR, US)
        max_results: 수집할 영상 수

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
        "videoCategoryId": category_id,
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            print(f"  ❌ YouTube API Error ({region_code}/{category_name}): {response.status_code}")
            return []

        data = response.json()
        videos = []

        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})

            videos.append({
                "video_id": item["id"],
                "title": snippet.get("title", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "category": category_name,
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "region": region_code,
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "trending_date": date.today().isoformat(),
                "crawled_at": datetime.now().isoformat()
            })

        print(f"  ✅ [{region_code}] {category_name}: {len(videos)}개 수집")
        return videos

    except Exception as e:
        print(f"  ❌ Exception ({region_code}/{category_name}): {e}")
        return []


def save_to_supabase(videos: List[Dict]):
    """수집한 동영상 데이터를 Supabase에 저장합니다."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️ Supabase credentials not set.")
        return

    endpoint = f"{SUPABASE_URL}/rest/v1/youtube_trends?on_conflict=video_id"
    headers = get_supabase_headers()

    saved = 0
    for video in videos:
        try:
            resp = requests.post(endpoint, json=video, headers=headers, timeout=10)
            if resp.status_code in range(200, 300):
                saved += 1
            else:
                print(f"  ⚠️ Save failed for {video['title'][:30]}: {resp.status_code}")
        except Exception as e:
            print(f"  ❌ Save error: {e}")

    print(f"  💾 {saved}/{len(videos)}개 저장 완료")


def run_youtube_crawler():
    """YouTube 카테고리별 트렌딩 크롤러 실행"""
    print(f"\n[{datetime.now()}] 🎬 YouTube Category Crawler 시작...")
    print(f"  📋 수집 대상: {len(TARGET_CATEGORIES)}개 카테고리 × {len(TARGET_REGIONS)}개 지역 × {PER_CATEGORY_PER_REGION}개")

    all_videos = []

    for category in TARGET_CATEGORIES:
        cat_id = category["id"]
        cat_name = category["name"]
        print(f"\n  🏷️ [{cat_name}] 카테고리 수집 중...")

        for region in TARGET_REGIONS:
            videos = fetch_videos_by_category(
                category_id=cat_id,
                category_name=cat_name,
                region_code=region,
                max_results=PER_CATEGORY_PER_REGION
            )
            all_videos.extend(videos)

    if all_videos:
        print(f"\n  📦 총 {len(all_videos)}개 영상 Supabase 저장 중...")
        save_to_supabase(all_videos)
    else:
        print("  ⚠️ 수집된 영상이 없습니다.")

    print(f"\n  🎬 YouTube Crawler 완료! (총 {len(all_videos)}개)\n")
    return all_videos


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        print("🚀 YouTube Category Crawler (단일 실행)...")
        run_youtube_crawler()
        print("✅ 완료!")
    else:
        import time as time_module
        print("🚀 YouTube Category Crawler (자동 반복 모드, 6시간 간격)")
        while True:
            run_youtube_crawler()
            print("😴 6시간 대기 중... (YouTube API 할당량 절약)")
            time_module.sleep(21600)  # 6시간
