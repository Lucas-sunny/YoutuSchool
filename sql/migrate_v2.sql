-- ====================================
-- The Info Club v2.0 Migration
-- Supabase SQL Editor에서 실행해주세요
-- ====================================

-- 1. 기존 posts 테이블에 ai_insight 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_insight text;

-- 2. YouTube 인기 동영상 테이블
CREATE TABLE IF NOT EXISTS public.youtube_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text UNIQUE NOT NULL,
  title text,
  channel_title text,
  category text,
  view_count bigint DEFAULT 0,
  like_count bigint DEFAULT 0,
  comment_count bigint DEFAULT 0,
  region text DEFAULT 'KR',
  thumbnail_url text,
  trending_date date DEFAULT CURRENT_DATE,
  crawled_at timestamptz DEFAULT now()
);

-- 3. Google 트렌드 키워드 테이블
CREATE TABLE IF NOT EXISTS public.google_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  region text DEFAULT 'south_korea',
  traffic_volume text,
  related_topics text,
  trending_date date DEFAULT CURRENT_DATE,
  crawled_at timestamptz DEFAULT now(),
  UNIQUE(keyword, region, trending_date)
);

-- 4. 주간 교차 분석 리포트 테이블
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  report_content text NOT NULL,
  hot_keywords jsonb,
  sources_summary jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5. RLS 정책 (읽기 공개)
ALTER TABLE public.youtube_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "youtube_trends_public_read" ON public.youtube_trends FOR SELECT USING (true);
CREATE POLICY "google_trends_public_read" ON public.google_trends FOR SELECT USING (true);
CREATE POLICY "weekly_reports_public_read" ON public.weekly_reports FOR SELECT USING (true);
