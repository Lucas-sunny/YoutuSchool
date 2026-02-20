"use client"

import { useState } from 'react'
import { MessageSquare, ThumbsUp, ExternalLink, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PostProps {
    post: {
        id: string
        title: string
        content: string
        subreddit: string
        url: string
        author: string
        created_at: string
        upvotes: number
        comment_count: number
        ai_insight?: string | null
    }
}

export function PostCard({ post }: PostProps) {
    // Simple parsing of content to separate Korean summary and English original
    // Expected format: "### 🇰🇷 요약\n...\n\n---\n### 🇺🇸 원문\n..."

    const parts = post.content.split('---')
    const koreanPart = parts[0] || post.content
    const englishPart = parts[1] || ""

    const [showOriginal, setShowOriginal] = useState(false)

    // Clean up markdown headers if needed for display, or just render as is
    // For now, simpler display
    const displayContent = showOriginal ? englishPart.replace('### 🇺🇸 원문', '').trim() : koreanPart.replace('### 🇰🇷 요약', '').trim()

    return (
        <div className="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">r/{post.subreddit}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}</span>
                    </div>
                    <Link href={post.url} target="_blank" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>

                <h3 className="text-xl font-bold leading-tight tracking-tight group-hover:underline decoration-primary underline-offset-4">
                    {post.title}
                </h3>

                <div className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
                    {displayContent || "No content available."}
                </div>

                {post.ai_insight && (
                    <div className="rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400">
                            <Sparkles className="h-4 w-4" />
                            AI 트렌드 인사이트
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {post.ai_insight}
                        </p>
                    </div>
                )}

                {englishPart && (
                    <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                    >
                        <Globe className="h-3 w-3" />
                        {showOriginal ? "한글 요약 보기" : "See Original (English)"}
                    </button>
                )}

                <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.upvotes}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comment_count}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
