'use client'

import { Clock } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
    const router = useRouter()

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
                        <li className="text-muted-foreground/60">🔓 승인 완료 → 콘텐츠 이용 가능</li>
                    </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                    승인 후 다시 로그인하면 바로 이용하실 수 있습니다.
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
