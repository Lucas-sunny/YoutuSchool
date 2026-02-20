"""
AI Summarizer - The Info Club v2.0
Reddit 포스트를 분석하여 유튜버를 위한 인사이트를 생성합니다.
OpenAI REST API를 requests로 직접 호출 (Python 3.14 호환)
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """당신은 유튜브 크리에이터를 위한 트렌드 분석가입니다.
Reddit에서 화제가 된 글을 분석하여, 한국 유튜버가 활용할 수 있는 인사이트를 제공해주세요.
반드시 한국어로 답변하고, 아래 3줄 형식을 따라주세요:

📌 트렌드: (이 글이 왜 주목할 만한지 한 줄 요약)
💡 활용법: (유튜버가 이 트렌드를 어떻게 콘텐츠로 만들 수 있는지)
🎯 액션: (지금 바로 실행할 수 있는 구체적인 행동 하나)"""

USER_PROMPT_TEMPLATE = """다음 Reddit 글을 분석해주세요:

서브레딧: r/{subreddit}
제목: {title}
내용: {content}"""


def generate_insight(title: str, content: str, subreddit: str) -> str | None:
    """
    OpenAI REST API로 포스트 인사이트를 생성합니다.
    """
    if not OPENAI_API_KEY:
        print("  ⚠️ OPENAI_API_KEY not set, skipping AI insight.")
        return None

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
                subreddit=subreddit,
                title=title,
                content=content[:2000]
            )}
        ],
        "max_tokens": 300,
        "temperature": 0.7
    }

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        if resp.status_code == 200:
            insight = resp.json()["choices"][0]["message"]["content"].strip()
            print(f"  ✨ AI Insight generated successfully!")
            return insight
        else:
            print(f"  ❌ AI Insight failed: {resp.status_code} - {resp.text[:100]}")
            return None
    except Exception as e:
        print(f"  ❌ AI Insight generation failed: {e}")
        return None
