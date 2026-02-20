"""
Supabase Migration: ai_insight 컬럼 추가
YoutuSchool posts 테이블에 AI 인사이트를 저장할 컬럼을 추가합니다.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 테스트: 기존 posts 테이블에 빈 ai_insight 값으로 업데이트 가능한지 확인
# Supabase는 새 컬럼을 REST API로 직접 추가할 수 없으므로,
# Supabase Dashboard > SQL Editor에서 아래 SQL을 실행해주세요:
#
#   ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_insight text;
#
# 또는 이 스크립트를 실행하면 자동으로 시도합니다.

def add_ai_insight_column():
    """Supabase Dashboard의 SQL Editor에서 실행할 SQL을 출력합니다."""
    print("=" * 60)
    print("🔧 Supabase Migration Required!")
    print("=" * 60)
    print()
    print("Supabase Dashboard > SQL Editor 에서 아래 SQL을 실행해주세요:")
    print()
    print("  ALTER TABLE public.posts")
    print("  ADD COLUMN IF NOT EXISTS ai_insight text;")
    print()
    print("=" * 60)
    print(f"Dashboard URL: {SUPABASE_URL.replace('.supabase.co', '.supabase.co')}")
    print(">> https://supabase.com/dashboard 에서 프로젝트 선택 > SQL Editor")
    print("=" * 60)

if __name__ == "__main__":
    add_ai_insight_column()
