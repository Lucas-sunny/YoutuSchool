import Link from 'next/link'
import { Youtube } from 'lucide-react'

export function Navbar() {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link className="flex items-center gap-2 font-bold text-xl tracking-tighter" href="/">
                    <Youtube className="h-6 w-6 text-red-600" />
                    <span>YoutuSchool</span>
                </Link>
                <div className="flex gap-4">
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
                        커뮤니티
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
                        자료실
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#">
                        소개
                    </Link>
                </div>
            </div>
        </nav>
    )
}
