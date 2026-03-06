'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isApproved, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return // AuthProvider가 완전히 로드될 때까지 대기

        if (!user) {
            router.push('/login')
            return
        }

        if (!isApproved) {
            router.push('/pending')
        }
    }, [user, isAdmin, isApproved, loading, router])

    // 로딩 중
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="space-y-3 text-center">
                    <div className="text-4xl animate-pulse">☀️</div>
                    <p className="text-muted-foreground text-sm">불러오는 중...</p>
                </div>
            </div>
        )
    }

    // 비로그인 or 미승인 → null 반환 (useEffect에서 redirect 처리)
    if (!user || !isApproved) return null

    return <>{children}</>
}
