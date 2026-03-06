'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { CheckCircle, XCircle, Clock, Users, AlertCircle } from 'lucide-react'

interface UserProfile {
    id: string
    email: string
    name: string
    status: string
    created_at: string
}

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const [profiles, setProfiles] = useState<UserProfile[]>([])
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin) {
                router.push('/')
                return
            }
            fetchProfiles()
        }
    }, [loading, user, isAdmin])

    async function fetchProfiles() {
        setFetching(true)
        setError('')
        try {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
            const data = await res.json()
            setProfiles(Array.isArray(data) ? data : [])
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : '회원 목록을 불러오지 못했습니다.')
        } finally {
            setFetching(false)
        }
    }

    async function handleApprove(id: string) {
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'approved' })
            })
            await fetchProfiles()
        } catch { setError('승인 처리 중 오류가 발생했습니다.') }
    }

    async function handleReject(id: string) {
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected' })
            })
            await fetchProfiles()
        } catch { setError('거절 처리 중 오류가 발생했습니다.') }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">인증 확인 중...</p>
            </div>
        )
    }

    const pending = profiles.filter(p => p.status === 'pending')
    const approved = profiles.filter(p => p.status === 'approved')
    const rejected = profiles.filter(p => p.status === 'rejected')

    const statusBadge = (status: string) => {
        if (status === 'approved') return <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">승인됨</span>
        if (status === 'rejected') return <span className="text-xs bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">거절됨</span>
        return <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">대기 중</span>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> 회원 관리</h1>
                        <p className="text-muted-foreground mt-1">Sunny Insight 회원을 승인하거나 거절할 수 있습니다.</p>
                    </div>
                    <button onClick={fetchProfiles} disabled={fetching}
                        className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:opacity-80 transition disabled:opacity-50">
                        {fetching ? '새로고침 중...' : '🔄 새로고침'}
                    </button>
                </div>

                {/* 에러 */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: '대기 중', count: pending.length, icon: Clock, color: 'text-amber-500' },
                        { label: '승인됨', count: approved.length, icon: CheckCircle, color: 'text-green-500' },
                        { label: '거절됨', count: rejected.length, icon: XCircle, color: 'text-red-500' },
                    ].map(({ label, count, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl border bg-card p-4 text-center space-y-1">
                            <Icon className={`h-6 w-6 mx-auto ${color}`} />
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>

                {/* 회원 목록 */}
                <div className="space-y-3">
                    {fetching && profiles.length === 0 && (
                        <p className="text-center py-10 text-muted-foreground">회원 목록 불러오는 중...</p>
                    )}
                    {!fetching && profiles.length === 0 && !error && (
                        <p className="text-center py-10 text-muted-foreground">아직 가입한 회원이 없습니다.</p>
                    )}
                    {profiles.map(profile => (
                        <div key={profile.id} className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold truncate">{profile.name}</p>
                                    {statusBadge(profile.status)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                                <p className="text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>
                            </div>
                            {profile.status === 'pending' && (
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleApprove(profile.id)}
                                        className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                                        <CheckCircle className="h-4 w-4" /> 승인
                                    </button>
                                    <button onClick={() => handleReject(profile.id)}
                                        className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">
                                        <XCircle className="h-4 w-4" /> 거절
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
