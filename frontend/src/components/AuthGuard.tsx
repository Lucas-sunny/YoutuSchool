'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isApproved, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        if (!user) {
            router.push('/login')
            return
        }

        if (!isApproved) {
            router.push('/pending')
        }
    }, [user, isApproved, loading, router])

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

    if (!user || !isApproved) return null

    return <>{children}</>
}
