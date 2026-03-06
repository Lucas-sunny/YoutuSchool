import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'ysmin3644@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // 서버사이드 세션 확인
    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // ─── 공개 페이지 ───────────────────────────
    // /login, /register, /pending, /api, 정적 파일은 통과

    // /login: 이미 로그인되어 있으면 메인으로
    if (pathname === '/login') {
        if (user) return NextResponse.redirect(new URL('/', request.url))
        return supabaseResponse
    }

    // ─── 인증 필요 페이지 ──────────────────────
    // 로그인 안 된 경우 → /login으로
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 관리자는 모든 페이지 접근 허용
    if (user.email === ADMIN_EMAIL) {
        return supabaseResponse
    }

    // /admin: 관리자만 허용
    if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 일반 유저: 승인 여부 확인
    if (pathname === '/') {
        try {
            const profileRes = await fetch(
                `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}&select=status`,
                {
                    headers: {
                        'apikey': SERVICE_KEY,
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                    },
                }
            )
            const profiles = await profileRes.json()
            const status = profiles?.[0]?.status

            if (status !== 'approved') {
                return NextResponse.redirect(new URL('/pending', request.url))
            }
        } catch {
            // DB 확인 실패시 pending으로
            return NextResponse.redirect(new URL('/pending', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|register|pending).*)',
    ],
}
