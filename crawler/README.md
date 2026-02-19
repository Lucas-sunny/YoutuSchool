# YoutuSchool Crawler Setup

## Prerequisites
1.  **Python 3.8+**
2.  **Reddit API Credentials**:
    - Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
    - Create a "script" app.
    - Note `client_id` and `client_secret`.
3.  **Supabase Project**:
    - Create a new project.
    - Run the SQL in `../sql/schema.sql` in the Supabase SQL Editor.
    - Get `SUPABASE_URL` and `SUPABASE_KEY` (service_role key recommended for crawler).

## Installation
1.  Navigate to `crawler` directory.
2.  Install dependencies (if not already done):
    ```bash
    pip install praw requests python-dotenv
    ```

## Configuration
1.  Copy `.env.example` to `.env`.
2.  Fill in the values:
    ```ini
    REDDIT_CLIENT_ID=...
    REDDIT_CLIENT_SECRET=...
    REDDIT_USER_AGENT=python:YoutuSchool:v1.0 (by /u/your_username)
    SUPABASE_URL=...
    SUPABASE_KEY=...
    ```

## Running
Run the crawler:
```bash
python crawler.py
```
It will run continuously, fetching updates every hour.
