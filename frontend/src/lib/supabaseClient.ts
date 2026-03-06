import { createBrowserClient } from '@supabase/ssr'

// 브라우저용 Supabase 클라이언트 (쿠키 기반 세션 관리)
// getSession() hanging 문제를 해결하기 위해 @supabase/ssr 사용
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
