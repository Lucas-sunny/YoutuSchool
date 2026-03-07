-- ====================================
-- 고도화 리포트를 위한 posts 테이블 컬럼 추가
-- Supabase SQL Editor에서 실행해주세요
-- ====================================

-- 1. 업보트(추천) 비율 저장용 컬럼
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvote_ratio real DEFAULT 1.0;

-- 2. 상위 댓글 데이터 저장용 컬럼 (JSON 형식)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS top_comments jsonb DEFAULT '[]'::jsonb;
