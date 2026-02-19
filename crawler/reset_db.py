import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

def reset_db():
    print("🗑️ Clearing all posts from database...")
    # Supabase Delete All: DELETE to /rest/v1/posts?post_id=neq.dummy
    # We use post_id (text) to avoid type errors with UUID/BigInt
    endpoint = f"{SUPABASE_URL}/rest/v1/posts?post_id=neq.dummy_val"
    
    try:
        response = requests.delete(endpoint, headers=get_supabase_headers())
        if response.status_code in [200, 204]:
            print("✅ Database cleared successfully.")
        else:
            print(f"❌ Failed to clear database: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error during reset: {e}")

if __name__ == "__main__":
    reset_db()
