import os
import time
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from datetime import datetime
import re
from deep_translator import GoogleTranslator
from ai_summarizer import generate_insight

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Target Subreddits (RSS URLs)
TARGET_SUBREDDITS = [
    "NewTubers",
    "YouTubers",
    "PartneredYoutube",
    "smallyoutubers",
    "youtube"
]

# Filtering Constants
MIN_CONTENT_LENGTH = 500  # 🚀 (UPGRADED) 400 -> 500: 더욱 긴 전문 분석글
# Increased diversity threshold
MIN_CHAR_DIVERSITY = 0.15 
SPAM_KEYWORDS = ["check out my", "new video", "sub4sub", "watch my", "please subscribe", "channel review", "my first video"]

# 🚀 (신규) 뻔한/초보적인 질문성 글 필터링용 블랙리스트
QUESTION_BLACKLIST = [
    "help me", "why is my", "how do i", "is it normal", "anyone else",
    "can i", "am i", "please help", "what should i do", "my channel", "should i",
    "zero views", "0 views", "shadow ban", "shadowban", "why no views", "just started"
]

# (신규) 서브레딧별 최소 업보트 기준 (가벼운 질문글 차단)
MIN_UPVOTES_REQUIRED = {
    "NewTubers": 100,      # 초보 커뮤니티는 정말 핫한 팁글만
    "YouTubers": 50,
    "PartneredYoutube": 30, # 수익창출 커뮤니티는 기준 조금 낮춤
    "smallyoutubers": 50,
    "youtube": 200          # 대형 레딧은 컷팅을 높임
}

# ✅ 유튜브 관련 화이트리스트 키워드 (이 중 하나라도 포함된 글만 수집)
YOUTUBE_RELEVANT_KEYWORDS = [
    # 심층 분석/데이터 관련
    "case study", "experiment", "data", "analysis", "statistics", "retention", "audience retention",
    "algorithm", "crackdown", "deep dive", "revenue", "rpm", "cpm", "ctr", "avd",
    
    # 정책/수익 관련
    "policy", "terms of service", "monetization", "ypp", "partner program",
    "update", "news", "feature", "strike", "demonetized", "earn", "income",
    "analytics", "metrics", "growth", "strategy", "tips", "guide"
]

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

import html

def clean_html(raw_html):
    if not raw_html: return ""
    content = html.unescape(raw_html)
    if "submitted by" in content:
         content = content.split("submitted by")[0]
    content = content.replace("[link]", "").replace("[comments]", "")
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', content)
    return cleantext.strip()

def is_youtube_relevant(title, content):
    combined = (title + " " + content).lower()
    for keyword in YOUTUBE_RELEVANT_KEYWORDS:
        if keyword.lower() in combined:
            return True
    return False

def validate_post(subreddit, title, content, upvotes):
    title_lower = title.lower()
    
    # 1. Minimum Upvote Check (🚀 신규 도입)
    min_req = MIN_UPVOTES_REQUIRED.get(subreddit, 50)
    if upvotes < min_req:
        return False, f"Not enough upvotes ({upvotes} < {min_req})"

    # 2. Length Check
    if len(content) < MIN_CONTENT_LENGTH:
        return False, f"Too short ({len(content)} chars)"

    # 3. Spam Keyword Check
    for keyword in SPAM_KEYWORDS:
        if keyword in title_lower:
            return False, f"Spam keyword found: {keyword}"

    # 4. Question & Basic Support Check (🚀 신규 초보글 필터)
    for q_word in QUESTION_BLACKLIST:
        if q_word in title_lower: # 제목에 초보적인 질문/하소연이 있으면 버림
            return False, f"Support/Basic Question ignored: {q_word}"

    # 5. Repetition Check removed because long posts naturally have low char diversity

    return True, "Valid"

def parse_post_id(entry_id):
    match = re.search(r'comments/([^/]+)/', entry_id)
    if match: return match.group(1)
    return entry_id

def get_text(element, tag, ns):
    found = element.find(tag, ns)
    if found is not None and found.text: return found.text
    return ""

def translate_text(text):
    """Translate text to Korean"""
    if not text:
        return ""
    try:
        # Translate title or short content
        # deep-translator handles limits internally usually, but best to keep short or chunk
        translator = GoogleTranslator(source='auto', target='ko')
        return translator.translate(text[:4500]) # Limit to 4500 to be safe
    except Exception as e:
        print(f"  Translation Failed: {e}")
        return text

def run_crawler():
    print(f"[{datetime.now()}] Starting JSON API crawler cycle...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Missing Supabase environment variables.")
        return

    for subreddit in TARGET_SUBREDDITS:
        for json_suffix in ["top.json?t=month&limit=100", "hot.json?limit=100"]:
            json_url = f"https://www.reddit.com/r/{subreddit}/{json_suffix}"
            print(f"Fetching JSON: {json_url}")
            
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 YoutuSchool/2.0'}
                response = requests.get(json_url, headers=headers)
                
                if response.status_code != 200:
                    print(f"  Failed to fetch JSON for {subreddit}: {response.status_code}")
                    continue

                data = response.json()
                posts = data.get('data', {}).get('children', [])
                
                for post in posts:
                    post_info = post.get('data', {})
                    title = post_info.get('title', '')
                    content_raw = post_info.get('selftext', '')
                    permalink = post_info.get('permalink', '')
                    link = f"https://www.reddit.com{permalink}"
                    author = post_info.get('author', 'unknown')
                    post_id = post_info.get('id', '')
                    upvotes = post_info.get('ups', 0)
                    comment_count = post_info.get('num_comments', 0)
                    upvote_ratio = post_info.get('upvote_ratio', 1.0)
                    created_utc = post_info.get('created_utc', 0)
                    published_str = datetime.fromtimestamp(created_utc).isoformat() if created_utc else datetime.now().isoformat()

                    # Clean and validate content
                    cleaned_content = clean_html(content_raw)
                    is_valid, reason = validate_post(subreddit, title, cleaned_content, upvotes)

                    if not is_valid:
                        continue

                    # ✅ 유튜브 관련 글만 수집 (정책/수익창출/뉴스)
                    if not is_youtube_relevant(title, cleaned_content):
                        continue
                    
                    # Fetch Top Comments
                    top_comments = []
                    if comment_count > 0:
                        comments_url = f"https://www.reddit.com{permalink}.json?limit=5&depth=1"
                        try:
                            c_resp = requests.get(comments_url, headers=headers)
                            if c_resp.status_code == 200:
                                c_data = c_resp.json()
                                if len(c_data) > 1:
                                    c_children = c_data[1].get('data', {}).get('children', [])
                                    for c in c_children[:3]:  # Top 3 comments
                                        c_info = c.get('data', {})
                                        c_body = c_info.get('body', '')
                                        if c_body and c_body != '[deleted]' and c_body != '[removed]':
                                            top_comments.append({
                                                "author": c_info.get('author', 'unknown'),
                                                "ups": c_info.get('ups', 0),
                                                "body": c_body[:500] # Limit length
                                            })
                        except Exception as ce:
                            print(f"  Failed to fetch comments for {post_id}: {ce}")
                        time.sleep(0.5) # API rate limit protection

                    # Translate title and content
                    translated_title = translate_text(title)
                    translated_content = translate_text(cleaned_content)

                    # Generate AI Insight
                    print(f"  🤖 Generating AI Insight for: {title[:50]}...")
                    ai_insight = generate_insight(
                        title=title,
                        content=cleaned_content,
                        subreddit=subreddit
                    )

                    # Prepare data for Supabase
                    post_data = {
                        "post_id": post_id,
                        "subreddit": subreddit,
                        "title": translated_title,
                        "content": f"### 🇰🇷 요약\n{translated_content}\n\n---\n### 🇺🇸 원문\n{cleaned_content}",
                        "url": link,
                        "author": author,
                        "upvotes": upvotes,
                        "comment_count": comment_count,
                        "upvote_ratio": float(upvote_ratio),
                        "top_comments": top_comments, # Will be automatically converted to JSONB via Supabase REST
                        "created_at": published_str,
                        "crawled_at": datetime.now().isoformat(),
                    }
                    
                    if ai_insight:
                        post_data["ai_insight"] = ai_insight

                    # Insert into Supabase
                    endpoint = f"{SUPABASE_URL}/rest/v1/posts?on_conflict=post_id"
                    upsert_response = requests.post(endpoint, json=post_data, headers=get_supabase_headers())

                    if upsert_response.status_code not in range(200, 300):
                        print(f"  Failed to save: {upsert_response.status_code} - {upsert_response.text}")
                    
                    time.sleep(1) # API limit safety
                    
            except Exception as e:
                print(f"Error processing {subreddit} - {json_suffix}: {e}")
                import traceback
                traceback.print_exc()
            
    print("Crawler cycle finished.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        print("🚀 Running crawler once (GitHub Actions Mode)...")
        run_crawler()
        print("✅ Crawler cycle completed.")
    else:
        print("🚀 RSS Crawler initialized (Korean Translation Enabled 🇰🇷).")
        while True:
            run_crawler()
            print("Sleeping for 60 seconds...")
            time.sleep(60)
