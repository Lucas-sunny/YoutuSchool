'use client'

import Link from 'next/link'
import { Youtube, LogOut, Shield, FileText } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Navbar() {
    const { user, isAdmin } = useAuth()
    const router = useRouter()

    async function handleLogout() {
        await signOut()
        router.push('/login')
    }

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link className="flex items-center gap-2 font-bold text-xl tracking-tighter" href="/">
                    <Youtube className="h-6 w-6 text-red-600" />
                    <span>Sunny Insight</span>
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link
                                href="/report"
                                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                                주간 리포트
                            </Link>
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
                                >
                                    <Shield className="h-4 w-4" />
                                    관리자
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
