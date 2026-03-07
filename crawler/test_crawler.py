import requests
import re
import html
from crawler import MIN_CONTENT_LENGTH, MIN_CHAR_DIVERSITY, SPAM_KEYWORDS, QUESTION_BLACKLIST, MIN_UPVOTES_REQUIRED, YOUTUBE_RELEVANT_KEYWORDS
from crawler import clean_html, is_youtube_relevant, validate_post

def run_debug():
    url = "https://www.reddit.com/r/PartneredYoutube/top.json?t=month&limit=50"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'}
    resp = requests.get(url, headers=headers)
    posts = resp.json().get('data', {}).get('children', [])
    
    stats = {"total": len(posts), "valid_upvotes": 0, "valid_len": 0, "valid_blacklist": 0, "relevant": 0}
    
    for p in posts:
        info = p.get('data', {})
        title = info.get('title', '')
        content = clean_html(info.get('selftext', ''))
        ups = info.get('ups', 0)
        
        print(f"\nTitle: {title} (Ups: {ups}, Len: {len(content)})")
        
        is_val, reason = validate_post("PartneredYoutube", title, content, ups)
        if not is_val:
            print(f"  ❌ Failed Validation: {reason}")
            continue
            
        print("  ✅ Passed Validation!")
        stats["valid_blacklist"] += 1
        
        if not is_youtube_relevant(title, content):
            print("  ❌ Failed Relevant Check")
            continue
            
        print("  ✅ Passed Relevant Check!!")
        stats["relevant"] += 1

if __name__ == "__main__":
    run_debug()
