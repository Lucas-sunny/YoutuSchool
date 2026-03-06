'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ADMIN_EMAIL } from '@/lib/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'approved' | 'done'>('loading')
    const router = useRouter()

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>

        const checkAuth = async () => {
            try {
                // 만료된 토큰 갱신이 무한정 걸리는 경우 대비 - 5초 타임아웃
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 5000)
                )

                const result = await Promise.race([sessionPromise, timeoutPromise])

                // 타임아웃 발생 시 로컬 세션 초기화 후 로그인으로
                if (!result) {
                    console.warn('Session check timed out - clearing local session')
                    await supabase.auth.signOut({ scope: 'local' })
                    router.push('/login')
                    return
                }

                const { data: { session } } = result

                if (!session?.user) {
                    router.push('/login')
                    return
                }

                // 관리자는 바로 승인
                if (session.user.email === ADMIN_EMAIL) {
                    setStatus('approved')
                    return
                }

                // 일반 회원: API로 승인 상태 확인
                try {
                    const res = await fetch(`/api/user/profile?id=${session.user.id}`)
                    const profile = res.ok ? await res.json() : null
                    if (profile?.status === 'approved') {
                        setStatus('approved')
                    } else {
                        router.push('/pending')
                    }
                } catch {
                    router.push('/pending')
                }
            } catch {
                router.push('/login')
            }
        }

        checkAuth()

        return () => clearTimeout(timeoutId)
    }, [router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="space-y-3 text-center">
                    <div className="text-4xl animate-pulse">☀️</div>
                    <p className="text-muted-foreground text-sm">불러오는 중...</p>
                </div>
            </div>
        )
    }

    if (status !== 'approved') return null

    return <>{children}</>
}
