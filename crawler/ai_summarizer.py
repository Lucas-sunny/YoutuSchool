"""
AI Summarizer - The Info Club v3.0
유튜브 정책/수익창출/뉴스 특화 인사이트 생성기
Reddit 포스트를 분석하여 유튜버를 위한 상세 인사이트를 생성합니다.
OpenAI REST API를 requests로 직접 호출 (Python 3.14 호환)
"""
import os
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """당신은 유튜브 크리에이터 전문 정책 & 트렌드 분석가입니다.
Reddit에서 수집된 유튜브 정책, 수익창출, 뉴스 관련 글을 심층 분석하여,
한국 유튜버와 수강생이 실제로 활용할 수 있는 상세한 인사이트를 제공합니다.

반드시 한국어로 답변하고, 아래 6섹션 형식을 정확히 따라주세요:

📋 분류: (정책변경 / 수익창출 / 유튜브뉴스 / 알고리즘변화 / 크리에이터팁 중 해당 항목)
📌 핵심 요약: (이 글의 핵심 내용을 2~3줄로 명확하게 정리)
⚠️ 크리에이터 영향: (이 정보가 채널 운영에 구체적으로 어떤 영향을 주는지 설명)
💡 대응 전략: (수강생이 지금 당장 확인하거나 바꿔야 할 사항을 구체적으로 안내)
🎯 실행 액션: (오늘 바로 실행할 수 있는 구체적인 행동 1~2가지)
🔗 관련 기준: (연관된 유튜브 공식 정책명, 기준, 또는 수치가 있다면 명시. 없으면 '해당 없음')

각 섹션은 반드시 위 이모지와 함께 시작해야 합니다."""

USER_PROMPT_TEMPLATE = """다음 Reddit 글을 분석해주세요:

서브레딧: r/{subreddit}
제목: {title}
내용: {content}

위 6섹션 형식으로 상세하게 분석해주세요. 특히 한국 유튜버 수강생 관점에서 실용적인 정보를 제공해주세요."""


def generate_insight(title: str, content: str, subreddit: str) -> Optional[str]:
    """
    OpenAI REST API로 포스트 인사이트를 생성합니다.
    유튜브 정책/수익창출/뉴스에 특화된 6섹션 상세 분석
    """
    if not OPENAI_API_KEY:
        print("  [WARN] OPENAI_API_KEY not set, skipping AI insight.")
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
                content=content[:3000]  # 더 많은 내용 전달 (2000 -> 3000)
            )}
        ],
        "max_tokens": 600,      # 상세 분석을 위해 증가 (300 -> 600)
        "temperature": 0.6      # 일관성 높이기 위해 낮춤 (0.7 -> 0.6)
    }

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15          # 응답 시간 여유 확보 (5 -> 15초)
        )
        if resp.status_code == 200:
            insight = resp.json()["choices"][0]["message"]["content"].strip()
            print(f"  [OK] AI Insight generated successfully!")
            return insight
        else:
            print(f"  [ERROR] AI Insight failed: {resp.status_code} - {resp.text[:100]}")
            return None
    except requests.exceptions.Timeout:
        print("  [TIMEOUT] AI Insight timeout (15s) - skipping")
        return None
    except requests.exceptions.ConnectionError:
        print("  [CONN ERROR] AI Insight connection failed - skipping")
        return None
    except Exception as e:
        print(f"  [FAIL] AI Insight generation failed: {e}")
        return None
