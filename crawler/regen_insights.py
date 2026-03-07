import os
import requests
from dotenv import load_dotenv
from ai_summarizer import generate_insight

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def run():
    print("Fetching 10 recent posts to upgrade insights...")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/posts?select=id,post_id,title,content,subreddit&order=created_at.desc&limit=10",
        headers=get_headers()
    )
    posts = r.json()
    
    for p in posts:
        print(f"Regenerating for: {p['title'][:50]}")
        insight = generate_insight(p['title'], p['content'], p['subreddit'])
        if insight:
            payload = {"ai_insight": insight}
            upd = requests.patch(
                f"{SUPABASE_URL}/rest/v1/posts?id=eq.{p['id']}",
                headers=get_headers(),
                json=payload
            )
            print(f"Updated: {upd.status_code}")

if __name__ == "__main__":
    run()
