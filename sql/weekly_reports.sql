-- =====================================================
-- weekly_reports 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

CREATE TABLE IF NOT EXISTS weekly_reports (
    id bigserial PRIMARY KEY,
    week_label text UNIQUE NOT NULL,       -- "2026년 3월 1주차"
    summary text,                          -- 이번 주 핵심 1줄 요약
    part_a text,                           -- 유튜브 동향&뉴스 TOP 5 (JSON 문자열)
    part_b text,                           -- 정책&수익창출 TOP 5 (JSON 문자열)
    post_count integer DEFAULT 0,          -- 분석에 사용된 포스트 수
    raw_data text,                         -- 전체 리포트 JSON (백업용)
    created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- 모든 로그인 사용자가 읽을 수 있도록
CREATE POLICY "로그인 유저 읽기 허용" ON weekly_reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- 서비스 롤(크롤러)만 Insert/Update 가능
-- (Service Role Key는 RLS를 우회하므로 별도 정책 불필요)
