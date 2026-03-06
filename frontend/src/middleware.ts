import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'ysmin3644@gmail.com'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 세션 갱신 (쿠키 업데이트)
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // /login 페이지: 이미 로그인되어 있으면 메인으로
    if (pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // /admin 페이지: 관리자만 허용
    if (pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 메인 페이지: 로그인 필요
    if (pathname === '/') {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // 승인 여부는 AuthGuard에서 클라이언트 사이드로 확인
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|register|pending).*)',
    ],
}
