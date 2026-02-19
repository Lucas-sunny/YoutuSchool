import os
import time
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from datetime import datetime
import re
from deep_translator import GoogleTranslator

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
MIN_CONTENT_LENGTH = 150
# Increased diversity threshold (Needs more unique chars to be valid text)
MIN_CHAR_DIVERSITY = 0.20 
SPAM_KEYWORDS = ["check out my", "new video", "sub4sub", "watch my", "please subscribe", "channel review", "my first video"]

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

import html

def clean_html(raw_html):
    """Remove HTML tags and Reddit footers from content"""
    if not raw_html: return ""
    
    # 1. Unescape HTML entities (&lt; -> <, &#32; -> space)
    content = html.unescape(raw_html)
    
    # 2. Remove Reddit RSS Footer (submitted by /u/...)
    # Pattern: "submitted by /u/..." often at the end or "submitted by..." in a table
    if "submitted by" in content:
         content = content.split("submitted by")[0]
    
    # 3. Remove [link] [comments] artifacts if they remain
    content = content.replace("[link]", "").replace("[comments]", "")

    # 4. Remove HTML Tags
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', content)
    
    return cleantext.strip()

def validate_post(title, content):
    """
    Filter out low-quality posts.
    Returns: (bool, reason)
    """
    # 1. Length Check
    if len(content) < MIN_CONTENT_LENGTH:
        return False, f"Too short ({len(content)} chars)"

    # 2. Keyword Check (Self-promotion)
    title_lower = title.lower()
    for keyword in SPAM_KEYWORDS:
        if keyword in title_lower:
            return False, f"Spam keyword found: {keyword}"

    # 3. Repetition/Spam Check (e.g. "aaaaa...")
    if len(content) > 0:
        unique_chars = len(set(content))
        diversity = unique_chars / len(content)
        if diversity < MIN_CHAR_DIVERSITY:
            return False, f"Low character diversity ({diversity:.2f})"

    # 4. Link Density Check
    if len(content) < 300 and "http" in content:
        # If >50% of the content is a link URL? Crude check.
        pass

    return True, "Valid"

def parse_post_id(entry_id):
    """Extract post ID from RSS entry ID/Link"""
    # RSS IDs usually look like: t3_12345 or link
    match = re.search(r'comments/([^/]+)/', entry_id)
    if match:
        return match.group(1)
    return entry_id

def get_text(element, tag, ns):
    """Helper to safely get text from XML element"""
    found = element.find(tag, ns)
    if found is not None and found.text:
       return found.text
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
    print(f"[{datetime.now()}] Starting RSS crawler cycle...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Missing Supabase environment variables.")
        return

    # XML Namespaces used by Reddit (Atom format)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}

    for subreddit in TARGET_SUBREDDITS:
        # Increase limit to 100 to get more candidates
        rss_url = f"https://www.reddit.com/r/{subreddit}/hot/.rss?limit=100"
        print(f"Fetching RSS: {rss_url}")
        
        try:
            # Update User-Agent to be more specific/unique to avoid generic block
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 YoutuSchool/1.0'}
            response = requests.get(rss_url, headers=headers)
            
            if response.status_code != 200:
                print(f"  Failed to fetch RSS for {subreddit}: {response.status_code}")
                continue # Skip to next subreddit

            root = ET.fromstring(response.content)
            
            for entry in root.findall('atom:entry', ns):
                title = get_text(entry, 'atom:title', ns)
                
                # Correct link extraction
                link_elem = entry.find('atom:link', ns)
                link = link_elem.attrib.get('href') if link_elem is not None else ""
                
                published_str = get_text(entry, 'atom:published', ns)
                content_html = get_text(entry, 'atom:content', ns)
                
                # Extract post ID
                post_id = parse_post_id(link)

                # Clean and validate content
                cleaned_content = clean_html(content_html)
                is_valid, reason = validate_post(title, cleaned_content)

                if not is_valid:
                    # print(f"  Skipping (invalid): {title[:50]}... ({reason})")
                    continue

                # Translate title and content
                translated_title = translate_text(title)
                translated_content = translate_text(cleaned_content)

                # Prepare data for Supabase
                post_data = {
                    "post_id": post_id,
                    "subreddit": subreddit,
                    "title": translated_title, # Store translated title
                    "content": f"### 🇰🇷 요약\n{translated_content}\n\n---\n### 🇺🇸 원문\n{cleaned_content}", # Combined content
                    "url": link,
                    "author": get_text(entry.find('atom:author', ns), 'atom:name', ns) if entry.find('atom:author', ns) is not None else "unknown",
                    "upvotes": 0,
                    "comment_count": 0,
                    "created_at": published_str if published_str else datetime.now().isoformat(),
                    "crawled_at": datetime.now().isoformat()
                }
                
                # Insert into Supabase
                endpoint = f"{SUPABASE_URL}/rest/v1/posts?on_conflict=post_id"
                upsert_response = requests.post(endpoint, json=post_data, headers=get_supabase_headers())
                
                if upsert_response.status_code in range(200, 300):
                     # print(f"  Saved: {title[:30]}...")
                     pass
                else:
                    print(f"  Failed to save: {upsert_response.status_code} - {upsert_response.text}")
                
                # Respect Translation API limits (small delay)
                time.sleep(0.5)

        except Exception as e:
            print(f"Error processing {subreddit}: {e}")
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
