"use client"

import { useEffect, useState } from 'react'
import { TrendingUp, Youtube, Search, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'

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

                // YouTube Trends
                const yt = await supabaseFetch(
                    'youtube_trends',
                    'select=*&order=view_count.desc&limit=20'
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
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {youtubeData.map((v, i) => (
                                        <a
                                            key={v.id}
                                            href={`https://www.youtube.com/watch?v=${v.video_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-all group"
                                        >
                                            <span className="text-2xl font-bold text-muted-foreground/30 min-w-[2rem]">
                                                {i + 1}
                                            </span>
                                            {v.thumbnail_url && (
                                                <img
                                                    src={v.thumbnail_url}
                                                    alt=""
                                                    className="w-24 h-16 object-cover rounded flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm leading-tight group-hover:text-red-500 line-clamp-2 transition-colors">
                                                    {v.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{v.channel_title}</span>
                                                    <span>•</span>
                                                    <span>조회수 {v.view_count >= 10000 ? `${(v.view_count / 10000).toFixed(1)}만` : v.view_count.toLocaleString()}</span>
                                                    <span className="ml-auto px-1.5 py-0.5 rounded bg-muted text-[10px]">
                                                        {v.category}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${v.region === 'KR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {v.region === 'KR' ? '🇰🇷 KR' : '🇺🇸 US'}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
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
