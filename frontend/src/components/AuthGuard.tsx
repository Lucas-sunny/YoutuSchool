'use client'

// 미들웨어에서 서버사이드로 인증 처리하므로
// AuthGuard는 단순히 children을 렌더링합니다.
// 세션이 없으면 미들웨어가 /login으로 자동 리다이렉트합니다.

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
