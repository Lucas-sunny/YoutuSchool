"use client"

import { useEffect, useState } from 'react'
import { TrendingUp, Youtube, Search, BarChart3, ChevronDown, ChevronUp, Globe } from 'lucide-react'

// 마크다운을 HTML로 변환하는 간단한 렌더러
function renderMarkdown(text: string) {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []

    lines.forEach((line, i) => {
        // ## 헤딩
        if (line.startsWith('## ')) {
            elements.push(
                <h3 key={i} className="text-lg font-bold mt-6 mb-2 text-purple-400">
                    {renderInline(line.slice(3))}
                </h3>
            )
        } else if (line.startsWith('# ')) {
            elements.push(
                <h2 key={i} className="text-xl font-bold mt-4 mb-3 text-purple-300">
                    {renderInline(line.slice(2))}
                </h2>
            )
        } else if (line.match(/^\d+\.\s/)) {
            // 번호 리스트
            elements.push(
                <div key={i} className="pl-4 py-1">
                    {renderInline(line)}
                </div>
            )
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            elements.push(
                <div key={i} className="pl-6 py-0.5">
                    <span className="text-purple-400 mr-2">•</span>
                    {renderInline(line.slice(2))}
                </div>
            )
        } else if (line.trim() === '---') {
            elements.push(<hr key={i} className="my-4 border-border/50" />)
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-2" />)
        } else {
            elements.push(
                <p key={i} className="py-0.5 leading-relaxed">
                    {renderInline(line)}
                </p>
            )
        }
    })

    return <>{elements}</>
}

// **bold** 텍스트를 <strong>으로 변환
function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
        }
        return part
    })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface YouTubeTrend {
    id: string
    video_id: string
    title: string
    channel_title: string
    category: string
    view_count: number
    region: string
    thumbnail_url: string
}

interface GoogleTrend {
    id: string
    keyword: string
    region: string
    traffic_volume: string
    related_topics: string
}

interface WeeklyReport {
    id: string
    week_start: string
    report_content: string
    hot_keywords: string
}

type Tab = 'youtube' | 'google' | 'report'

async function supabaseFetch(table: string, params: string = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
    const resp = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
    })
    if (!resp.ok) {
        console.error(`Supabase fetch error (${table}):`, resp.status, await resp.text())
        return []
    }
    return resp.json()
}

export function TrendDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('youtube')
    const [activeCategory, setActiveCategory] = useState<string>('전체')
    const [youtubeData, setYoutubeData] = useState<YouTubeTrend[]>([])
    const [googleData, setGoogleData] = useState<GoogleTrend[]>([])
    const [report, setReport] = useState<WeeklyReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reportExpanded, setReportExpanded] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                setError(null)

                // YouTube Trends - 넉넉하게 가져와서 프론트에서 필터
                const yt = await supabaseFetch(
                    'youtube_trends',
                    'select=*&order=view_count.desc&limit=300'
                )
                setYoutubeData(Array.isArray(yt) ? yt : [])

                // Google Trends
                const gt = await supabaseFetch(
                    'google_trends',
                    'select=*&order=crawled_at.desc&limit=30'
                )
                setGoogleData(Array.isArray(gt) ? gt : [])

                // Weekly Report (latest)
                const wr = await supabaseFetch(
                    'weekly_reports',
                    'select=*&order=created_at.desc&limit=1'
                )
                setReport(Array.isArray(wr) && wr.length > 0 ? wr[0] : null)
            } catch (err) {
                console.error('Dashboard fetch error:', err)
                setError('데이터를 불러오는 중 오류가 발생했습니다.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const tabs = [
        { id: 'youtube' as Tab, label: 'YouTube 인기', icon: Youtube, color: 'text-red-500' },
        { id: 'google' as Tab, label: 'Google 트렌드', icon: Search, color: 'text-blue-500' },
        { id: 'report' as Tab, label: '주간 리포트', icon: BarChart3, color: 'text-purple-500' },
    ]

    return (
        <section id="dashboard" className="container mx-auto px-4 md:px-6 py-12">
            <h2 className="text-3xl font-bold tracking-tighter mb-2 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                멀티 플랫폼 트렌드
            </h2>
            <p className="text-muted-foreground mb-6">Reddit + YouTube + Google 3곳의 트렌드를 한눈에</p>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.id
                            ? `${tab.color} border-current`
                            : 'text-muted-foreground border-transparent hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tab.id === 'youtube' && youtubeData.length > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full">{youtubeData.length}</span>
                        )}
                        {tab.id === 'google' && googleData.length > 0 && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full">{googleData.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-3" />
                    <p>📡 트렌드 데이터 불러오는 중...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-500">
                    <p>❌ {error}</p>
                </div>
            ) : (
                <>
                    {/* YouTube Tab */}
                    {activeTab === 'youtube' && (
                        <div className="space-y-3">
                            {youtubeData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">아직 YouTube 데이터가 없습니다. 크롤러를 실행해주세요.</p>
                            ) : (() => {
                                // 카테고리 목록 동적 생성
                                const categories = ['전체', ...Array.from(new Set(youtubeData.map(v => v.category))).sort()]

                                // 선택된 카테고리로 필터링
                                const byCat = activeCategory === '전체' ? youtubeData : youtubeData.filter(v => v.category === activeCategory)

                                // KR / US 분리 후 각 TOP 10
                                const krVideos = byCat.filter(v => v.region === 'KR').slice(0, 10)
                                const usVideos = byCat.filter(v => v.region === 'US').slice(0, 10)

                                // 카테고리별 이모지 매핑
                                const categoryEmoji: Record<string, string> = {
                                    '전체': '🔥', '음악': '🎵', '게임': '🎮', '엔터테인먼트': '🎬',
                                    '뉴스/정치': '📰', '교육': '📚', '스포츠': '⚽', '과학/기술': '🔬',
                                    '일상/블로그': '📹', '영화/애니메이션': '🎥', '코미디': '😂',
                                    '여행/이벤트': '✈️', '스타일/뷰티': '💄', '자동차': '🚗', '동물': '🐾',
                                    '비영리/사회운동': '🌱'
                                }

                                // 영상 카드 컴포넌트
                                const VideoCard = ({ v, i }: { v: YouTubeTrend; i: number }) => (
                                    <a
                                        href={`https://www.youtube.com/watch?v=${v.video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
                                    >
                                        <span className="text-lg font-bold text-muted-foreground/30 min-w-[1.5rem] pt-0.5">
                                            {i + 1}
                                        </span>
                                        {v.thumbnail_url && (
                                            <img
                                                src={v.thumbnail_url}
                                                alt=""
                                                className="w-20 h-14 object-cover rounded flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm leading-tight group-hover:text-red-500 line-clamp-2 transition-colors">
                                                {v.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{v.channel_title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                조회수 {v.view_count >= 10000 ? `${(v.view_count / 10000).toFixed(1)}만` : v.view_count.toLocaleString()}
                                            </p>
                                        </div>
                                    </a>
                                )

                                return (
                                    <>
                                        {/* 카테고리 서브탭 */}
                                        <div className="flex gap-1.5 flex-wrap mb-5 pb-3 border-b">
                                            {categories.map(cat => {
                                                const total = cat === '전체'
                                                    ? youtubeData.length
                                                    : youtubeData.filter(v => v.category === cat).length
                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setActiveCategory(cat)}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === cat
                                                                ? 'bg-red-500 text-white shadow-sm scale-105'
                                                                : 'bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        <span>{categoryEmoji[cat] || '📌'}</span>
                                                        <span>{cat}</span>
                                                        <span className={`px-1 rounded-full text-[10px] ${activeCategory === cat ? 'bg-white/20' : 'bg-background'
                                                            }`}>{total}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* 🇰🇷 한국 / 🇺🇸 해외 2단 레이아웃 */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* 한국 TOP 10 */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xl">🇰🇷</span>
                                                    <h3 className="font-bold text-base">한국 TOP {krVideos.length}</h3>
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-600 px-2 py-0.5 rounded-full">KR</span>
                                                </div>
                                                {krVideos.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground py-4 text-center">한국 데이터가 없습니다</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {krVideos.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 해외 TOP 10 */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xl">🇺🇸</span>
                                                    <h3 className="font-bold text-base">해외 TOP {usVideos.length}</h3>
                                                    <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-600 px-2 py-0.5 rounded-full">US</span>
                                                </div>
                                                {usVideos.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground py-4 text-center">해외 데이터가 없습니다</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {usVideos.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    )}


                    {/* Google Trends Tab */}
                    {activeTab === 'google' && (
                        <div className="space-y-3">
                            {googleData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">아직 Google Trends 데이터가 없습니다. 크롤러를 실행해주세요.</p>
                            ) : (
                                <>
                                    {/* Group by related_topics (category) */}
                                    {Array.from(new Set(googleData.map(k => k.related_topics || '기타'))).map((category) => {
                                        const categoryData = googleData.filter(k => (k.related_topics || '기타') === category)
                                        return (
                                            <div key={category} className="mb-6">
                                                <h3 className="text-lg font-semibold mb-3">
                                                    📊 {category}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {categoryData.map((k) => {
                                                        // 트렌드 방향에 따라 색상 결정
                                                        const isUp = k.traffic_volume?.includes('급상승') || k.traffic_volume?.includes('상승')
                                                        const isDown = k.traffic_volume?.includes('하락')
                                                        return (
                                                            <a
                                                                key={k.id}
                                                                href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(k.keyword)}&geo=${k.region === 'KR' ? 'KR' : 'US'}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border transition-colors text-sm ${isUp ? 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800' :
                                                                    isDown ? 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800' :
                                                                        'bg-card hover:bg-accent'
                                                                    }`}
                                                            >
                                                                <span className="font-medium">{k.keyword}</span>
                                                                <span className={`text-[10px] ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-orange-500'}`}>
                                                                    {k.traffic_volume?.split('(')[0]?.trim() || ''}
                                                                </span>
                                                            </a>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    )}

                    {/* Weekly Report Tab */}
                    {activeTab === 'report' && (
                        <div className="space-y-4">
                            {!report ? (
                                <p className="text-muted-foreground text-center py-8">아직 주간 리포트가 생성되지 않았습니다. trend_analyzer.py를 실행해주세요.</p>
                            ) : (
                                <div className="rounded-lg border bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">📊 주간 트렌드 리포트</h3>
                                            <p className="text-sm text-muted-foreground">주차: {report.week_start}</p>
                                        </div>
                                        <button
                                            onClick={() => setReportExpanded(!reportExpanded)}
                                            className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                                        >
                                            {reportExpanded ? (
                                                <><ChevronUp className="h-4 w-4" /> 접기</>
                                            ) : (
                                                <><ChevronDown className="h-4 w-4" /> 전체 보기</>
                                            )}
                                        </button>
                                    </div>
                                    <div className={`text-sm leading-relaxed ${reportExpanded ? '' : 'max-h-[300px] overflow-hidden relative'}`}>
                                        {renderMarkdown(report.report_content)}
                                        {!reportExpanded && (
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-purple-50 dark:from-purple-950/40 to-transparent" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    )
}
