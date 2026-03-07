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

SYSTEM_PROMPT = """당신은 상위 1% 유튜브 크리에이터 전문 수석 전략 애널리스트입니다.
Reddit에서 수집된 최상위 유튜브 정책, 수익창출, 관련 글을 심층 분석하여,
한국 유튜버와 수강생이 실제로 활용할 수 있는 '뻔하지 않은 극비 인사이트'를 제공합니다.

⚠️ 절대 규칙 (고급화 및 차별화 - 가장 중요!!!):
1. 한국 유튜브 생태계에 널리 퍼진 뻔한 정보(예: 일관성 유지해라, 썸네일 잘 만들어라 등)는 철저히 배제하세요.
2. 알고리즘의 구체적 동작 방식/데이터, 새로운 수익화 꼼수, 플랫폼의 구조적 변화 같은 '비밀스럽고 깊이 있는 고급 정보'만 선별하세요.
3. 모든 조언은 "데이터를 기반으로 즉각 내 채널에 적용할 수 있는 구체적이고 전문적인 기법"이어야 합니다.

반드시 한국어로 답변하고, 아래 4섹션 형식을 정확히 따라주세요:

🔥 파급력 요약: (실제 데이터와 댓글 반응을 기반으로 한 2~3줄 심층 해설)
⚠️ 크리에이터 영향: (한국 유튜버에게 체감되는 구체적이고 치명적인 영향. 수익/조회수 직결 내용)
💡 대응 전략: (위기에 대한 회피 또는 기회 선점 전략. 기획/편집 등 실무적 관점)
🎯 즉시 실행 액션: (오늘 바로 내 채널에서 점검하거나 실행할 구체적 지침 1가지)"""

USER_PROMPT_TEMPLATE = """다음 최고급 Reddit 글을 분석해주세요:

서브레딧: r/{subreddit}
제목: {title}
내용: {content}

위 4섹션 형식(🔥, ⚠️, 💡, 🎯)으로 뻔한 소리 없이 가장 날카롭고 전문적으로 분석해주세요."""


def generate_insight(title: str, content: str, subreddit: str) -> Optional[str]:
    """
    OpenAI REST API로 포스트 인사이트를 생성합니다.
    유튜브 정책/수익창출/뉴스에 특화된 4섹션 최고급 심층 분석
    """
    if not OPENAI_API_KEY:
        print("  [WARN] OPENAI_API_KEY not set, skipping AI insight.")
        return None

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o",  # 최고급 분석을 위해 gpt-4o 사용
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
                subreddit=subreddit,
                title=title,
                content=content[:4000]  # 더 많은 내용 전달 (3000 -> 4000)
            )}
        ],
        "max_tokens": 800,      # 상세 분석을 위해 증가 (600 -> 800)
        "temperature": 0.5      # 날카로움을 위해 조금 더 낮춤
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
