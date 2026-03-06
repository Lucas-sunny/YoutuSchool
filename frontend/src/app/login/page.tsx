'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // 이미 로그인되어 있으면 메인으로 이동
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.push('/')
            }
        })
    }, [router])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            })

            if (authError) {
                setError('이메일 또는 비밀번호가 올바르지 않습니다.')
                return
            }

            if (data.user) {
                // 로그인 성공 → 무조건 메인으로 이동 (AuthGuard에서 승인 여부 체크)
                router.push('/')
                router.refresh()
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                {/* 로고 */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight">☀️ Sunny Insight</h1>
                    <p className="mt-2 text-muted-foreground">유튜버를 위한 글로벌 인사이트 플랫폼</p>
                </div>

                {/* 로그인 폼 */}
                <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-center">로그인</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                                autoComplete="email"
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        아직 회원이 아니신가요?{' '}
                        <a href="/register" className="font-semibold text-primary hover:underline">
                            회원가입
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
