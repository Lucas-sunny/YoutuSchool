'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, RefreshCw } from 'lucide-react'
import { signOut, getUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

export default function PendingPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(false)
    const [message, setMessage] = useState('')

    // 승인 상태 자동 체크 (10초마다)
    useEffect(() => {
        const checkApproval = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const profile = await getUserProfile(user.id)
            if (profile?.status === 'approved') {
                setMessage('승인되었습니다! 이동 중...')
                setTimeout(() => router.push('/'), 1000)
            }
        }

        // 최초 1회 즉시 체크
        checkApproval()

        // 10초마다 자동 체크
        const interval = setInterval(checkApproval, 10000)
        return () => clearInterval(interval)
    }, [router])

    // 수동 확인 버튼
    async function handleRecheck() {
        setChecking(true)
        setMessage('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }
        const profile = await getUserProfile(user.id)
        if (profile?.status === 'approved') {
            setMessage('승인되었습니다! 이동 중...')
            setTimeout(() => router.push('/'), 800)
        } else {
            setMessage('아직 승인 대기 중입니다.')
            setChecking(false)
        }
    }

    async function handleLogout() {
        await signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md text-center space-y-8">
                {/* 아이콘 */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-amber-100 dark:bg-amber-950/40 p-6">
                        <Clock className="h-16 w-16 text-amber-500" />
                    </div>
                </div>

                {/* 메시지 */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold">승인 대기 중입니다 ☀️</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        회원가입이 완료되었습니다!<br />
                        관리자가 확인 후 승인해드리면<br />
                        <span className="font-semibold text-foreground">Sunny Insight</span>의 모든 콘텐츠를 이용하실 수 있습니다.
                    </p>
                </div>

                {/* 안내 박스 */}
                <div className="rounded-xl border bg-card p-6 space-y-2 text-left">
                    <h3 className="font-semibold text-sm">📋 승인 절차 안내</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                        <li>✅ 회원가입 완료</li>
                        <li className="text-amber-600 dark:text-amber-400 font-medium">⏳ 관리자 승인 대기 중</li>
                        <li className="text-muted-foreground/60">🔓 승인 완료 → 자동으로 이동됩니다</li>
                    </ul>
                </div>

                {/* 상태 메시지 */}
                {message && (
                    <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.includes('승인되었습니다')
                            ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                        {message.includes('승인되었습니다') && <CheckCircle className="inline h-4 w-4 mr-1" />}
                        {message}
                    </div>
                )}

                {/* 수동 확인 버튼 */}
                <button
                    onClick={handleRecheck}
                    disabled={checking}
                    className="flex items-center gap-2 mx-auto text-sm bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? '확인 중...' : '승인 여부 확인하기'}
                </button>

                <p className="text-xs text-muted-foreground">
                    승인되면 자동으로 이동됩니다 (10초마다 자동 확인 중)
                </p>

                <button
                    onClick={handleLogout}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition"
                >
                    로그아웃
                </button>
            </div>
        </div>
    )
}
