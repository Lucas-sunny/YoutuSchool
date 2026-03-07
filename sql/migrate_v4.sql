-- =====================================================
-- 기존 잘못된 구조의 weekly_reports 테이블을 드랍하고 새롭게 생성
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

DROP TABLE IF EXISTS public.weekly_reports CASCADE;

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id bigserial PRIMARY KEY,
    week_label text UNIQUE NOT NULL,
    summary text,
    part_a text,
    part_b text,
    post_count integer DEFAULT 0,
    raw_data text,
    created_at timestamptz DEFAULT now()
);

-- RLS 활성화 및 권한 설정
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "로그인 유저 읽기 허용" ON public.weekly_reports
    FOR SELECT USING (auth.role() = 'authenticated');
