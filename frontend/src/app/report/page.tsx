import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '@/components/AuthGuard'
import { FileText, TrendingUp, ShieldAlert, Calendar, ChevronRight } from 'lucide-react'

export const revalidate = 0

async function getLatestReport() {
    const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Error fetching report:', error)
        return null
    }
    return data
}

async function getAllReports() {
    const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, week_label, summary, post_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) return []
    return data || []
}

function RankBadge({ rank }: { rank: number }) {
    const colors: Record<number, string> = {
        1: 'bg-yellow-500 text-black',
        2: 'bg-gray-400 text-black',
        3: 'bg-amber-600 text-white',
    }
    return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${colors[rank] || 'bg-primary/20 text-primary'}`}>
            {rank}
        </span>
    )
}

function ReportItem({ item }: { item: any }) {
    return (
        <div className="border rounded-xl p-5 bg-card/50 hover:bg-card transition-colors space-y-3">
            <div className="flex items-start gap-3">
                <RankBadge rank={item.rank} />
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base leading-tight">{item.keyword}</h4>
                    {item.sources && item.sources.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            출처: {item.sources.join(' · ')}
                        </p>
                    )}
                </div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{item.summary}</p>
            {item.creator_impact && (
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                    <p className="text-xs font-semibold text-orange-400 mb-1">📌 크리에이터 영향</p>
                    <p className="text-sm text-foreground/80">{item.creator_impact}</p>
                </div>
            )}
            {item.strategy && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-xs font-semibold text-blue-400 mb-1">💡 대응 전략</p>
                    <p className="text-sm text-foreground/80">{item.strategy}</p>
                </div>
            )}
            {item.actions && item.actions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-green-400 mb-2">🎯 실행 액션</p>
                    <ul className="space-y-1">
                        {item.actions.map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                <ChevronRight className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {action}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default async function ReportPage() {
    const [latest, allReports] = await Promise.all([getLatestReport(), getAllReports()])

    let partA: any[] = []
    let partB: any[] = []

    if (latest) {
        try {
            partA = typeof latest.part_a === 'string' ? JSON.parse(latest.part_a) : (latest.part_a || [])
            partB = typeof latest.part_b === 'string' ? JSON.parse(latest.part_b) : (latest.part_b || [])
        } catch (e) {
            console.error('Failed to parse report parts:', e)
        }
    }

    return (
        <AuthGuard>
            <main className="min-h-screen bg-background">
                {/* 헤더 */}
                <section className="border-b bg-card/30 py-10">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tighter">주간 YouTube 트렌드 리포트</h1>
                        </div>
                        <p className="text-muted-foreground">
                            매주 월요일 자동 생성 · 실제 Reddit 데이터 기반 · AI 할루시네이션 Zero
                        </p>
                    </div>
                </section>

                {!latest ? (
                    <div className="container mx-auto px-4 md:px-6 py-20 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-xl font-semibold text-muted-foreground">아직 생성된 리포트가 없습니다</p>
                        <p className="text-sm text-muted-foreground mt-2">매주 월요일 오전 9시에 자동으로 생성됩니다.</p>
                    </div>
                ) : (
                    <div className="container mx-auto px-4 md:px-6 py-10 space-y-12">

                        {/* 이번 주 요약 카드 */}
                        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <span className="font-bold text-lg">{latest.week_label}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>분석 포스트 {latest.post_count}개</span>
                                    <span>{new Date(latest.created_at).toLocaleDateString('ko-KR')} 생성</span>
                                </div>
                            </div>
                            <p className="text-base font-medium text-foreground/90 border-l-4 border-primary pl-4">
                                {latest.summary}
                            </p>
                        </div>

                        {/* PART A: 유튜브 동향 & 뉴스 TOP 5 */}
                        {partA.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 pb-3 border-b">
                                    <TrendingUp className="h-7 w-7 text-blue-500" />
                                    유튜브 동향 &amp; 뉴스 TOP {partA.length}
                                    <span className="text-sm font-normal text-muted-foreground">이번 주 화제의 트렌드</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {partA.map((item: any) => (
                                        <ReportItem key={item.rank} item={item} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* PART B: 정책 & 수익창출 TOP 5 */}
                        {partB.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 pb-3 border-b">
                                    <ShieldAlert className="h-7 w-7 text-orange-500" />
                                    정책 &amp; 수익창출 TOP {partB.length}
                                    <span className="text-sm font-normal text-muted-foreground">놓치면 안 되는 정책 변화</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {partB.map((item: any) => (
                                        <ReportItem key={item.rank} item={item} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 지난 리포트 목록 */}
                        {allReports.length > 1 && (
                            <section>
                                <h3 className="text-lg font-bold mb-4 pb-2 border-b text-muted-foreground">📁 지난 리포트</h3>
                                <div className="space-y-2">
                                    {allReports.slice(1).map((r: any) => (
                                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/30 hover:bg-card transition-colors">
                                            <div>
                                                <span className="font-medium text-sm">{r.week_label}</span>
                                                <span className="text-xs text-muted-foreground ml-3">{r.summary?.slice(0, 50)}...</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>
                )}
            </main>
        </AuthGuard>
    )
}
