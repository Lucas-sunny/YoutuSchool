'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ADMIN_EMAIL } from '@/lib/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'approved' | 'redirect'>('loading')
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 세션 확인
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    router.push('/login')
                    return
                }

                // 관리자는 바로 승인
                if (session.user.email === ADMIN_EMAIL) {
                    setStatus('approved')
                    return
                }

                // 일반 회원 승인 상태 확인 (API 라우트 사용)
                try {
                    const res = await fetch(`/api/user/profile?id=${session.user.id}`)
                    if (res.ok) {
                        const profile = await res.json()
                        if (profile?.status === 'approved') {
                            setStatus('approved')
                        } else {
                            router.push('/pending')
                        }
                    } else {
                        // API 실패 시 pending으로
                        router.push('/pending')
                    }
                } catch {
                    router.push('/pending')
                }
            } catch {
                // 오류 시 로그인으로
                router.push('/login')
            }
        }

        checkAuth()
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
