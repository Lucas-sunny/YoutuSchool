'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getUserProfile, ADMIN_EMAIL, type UserProfile } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    isAdmin: boolean
    isApproved: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isAdmin: false,
    isApproved: false,
    loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 초기 세션 확인
        const initAuth = async () => {
            try {
                // 5초 타임아웃 - 만료 토큰 갱신이 무한 대기하는 경우 차단
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 5000)
                )
                const result = await Promise.race([sessionPromise, timeoutPromise])

                // 타임아웃 시 로컬 세션 초기화
                if (!result) {
                    await supabase.auth.signOut({ scope: 'local' })
                    return
                }

                const { data: { session } } = result
                const u = session?.user ?? null
                setUser(u)
                if (u) {
                    try {
                        const p = await getUserProfile(u.id)
                        setProfile(p)
                    } catch {
                        // 프로필 로드 실패해도 계속 진행
                    }
                }
            } catch {
                // 세션 확인 실패해도 계속 진행
            } finally {
                setLoading(false) // 항상 로딩 해제
            }
        }

        initAuth()

        // 로그인/로그아웃 이벤트 구독
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) {
                try {
                    const p = await getUserProfile(u.id)
                    setProfile(p)
                } catch {
                    setProfile(null)
                }
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => listener.subscription.unsubscribe()
    }, [])

    const isAdmin = user?.email === ADMIN_EMAIL
    const isApproved = isAdmin || profile?.status === 'approved'

    return (
        <AuthContext.Provider value={{ user, profile, isAdmin, isApproved, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
