/**
 * auth.ts - 인증 & 회원 상태 관리 유틸리티
 * Supabase Auth + user_profiles 테이블 기반
 */
import { supabase } from './supabaseClient'

// 관리자 이메일 (대표님 계정)
export const ADMIN_EMAIL = 'ysmin3644@gmail.com'

export type UserStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
    id: string
    email: string
    name: string
    status: UserStatus
    created_at: string
}

/** 회원가입 */
export async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
        // user_profiles에 pending 상태로 등록
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({ id: data.user.id, email, name, status: 'pending' })
        if (profileError) throw profileError
    }
    return data
}

/** 로그인 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

/** 로그아웃 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

/** 현재 로그인 유저 가져오기 */
export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
}

/** 현재 유저의 승인 상태 가져오기 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
    if (error) return null
    return data as UserProfile
}

/** 관리자: 전체 회원 목록 */
export async function getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) return []
    return (data as UserProfile[]) || []
}

/** 관리자: 회원 상태 변경 (승인/거절) */
export async function updateUserStatus(userId: string, status: UserStatus) {
    const { error } = await supabase
        .from('user_profiles')
        .update({ status })
        .eq('id', userId)
    if (error) throw error
}
