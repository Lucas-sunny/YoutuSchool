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
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) {
                const p = await getUserProfile(u.id)
                setProfile(p)
            }
            setLoading(false)
        })

        // 로그인/로그아웃 이벤트 구독
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) {
                const p = await getUserProfile(u.id)
                setProfile(p)
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
