import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/50 pointer-events-none" />
            <div className="container mx-auto relative px-4 md:px-6 flex flex-col items-center text-center space-y-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                        유튜브 크리에이터 아카데미
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                        해외 100만 유튜버들의 최신 노하우, 이제 한국어로 만나보세요.
                        <br className="hidden md:inline" />
                        전 세계 가장 큰 커뮤니티의 트렌드를 실시간으로 분석합니다.
                    </p>
                </div>
                <div className="space-x-4">
                    <Link
                        className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        href="#posts"
                    >
                        최신 트렌드 보기
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
