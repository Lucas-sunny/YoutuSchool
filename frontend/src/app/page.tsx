import { supabase } from '@/lib/supabaseClient'
import { Hero } from '@/components/Hero'
import { PostCard } from '@/components/PostCard'
import { TrendDashboard } from '@/components/TrendDashboard'
import AuthGuard from '@/components/AuthGuard'
import { Newspaper, Trophy, Users, Sparkles } from 'lucide-react'

// Fetch data from Supabase
export const revalidate = 0; // Disable static caching

async function getPosts() {
  // ai_insight가 있는 최신 포스트 우선 가져오기
  const { data: withInsight, error: e1 } = await supabase
    .from('posts')
    .select('*')
    .not('ai_insight', 'is', null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (e1) {
    console.error('Error fetching posts with insight:', e1)
  }

  // 인사이트 있는 게 30개 미만이면 최신 포스트로 채우기
  const insightPosts = withInsight || []
  if (insightPosts.length < 30) {
    const insightIds = insightPosts.map((p: any) => p.id)
    const { data: recent, error: e2 } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    if (!e2 && recent) {
      const merged = [...insightPosts, ...recent.filter((p: any) => !insightIds.includes(p.id))]
      return merged.slice(0, 30)
    }
  }

  return insightPosts
}


export default async function Home() {
  const posts = await getPosts()

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background">
        <Hero />

        {/* Features Section */}
        <section className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card/50">
              <Newspaper className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">실시간 트렌드</h3>
              <p className="text-sm text-gray-500 text-center">레딧(Reddit)의 핫한 크리에이터 커뮤니티 글을 실시간으로 가져옵니다.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card/50">
              <Users className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">글로벌 인사이트</h3>
              <p className="text-sm text-gray-500 text-center">전 세계 100만 명 이상의 크리에이터들의 노하우를 한국어로 번역해드립니다.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card/50">
              <Trophy className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">성장 전략</h3>
              <p className="text-sm text-gray-500 text-center">채널을 더 빠르게 성장시키기 위한 구체적인 전략과 팁을 확인하세요.</p>
            </div>
          </div>
        </section>

        {/* 📊 Multi-Platform Trend Dashboard */}
        <TrendDashboard />

        {/* 🔥 AI 추천 트렌드 섹션 */}
        {posts.filter((p: any) => p.ai_insight).length > 0 && (
          <section id="ai-trends" className="container mx-auto px-4 md:px-6 py-12">
            <h2 className="text-3xl font-bold tracking-tighter mb-8 border-b pb-4 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-orange-500" />
              AI 추천 트렌드
              <span className="text-lg font-normal text-muted-foreground ml-2">AI가 분석한 핫 토픽</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.filter((p: any) => p.ai_insight).slice(0, 6).map((post: any) => (
                <PostCard key={`insight-${post.id}`} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Posts Grid */}
        <section id="posts" className="container mx-auto px-4 md:px-6 py-12">
          <h2 className="text-3xl font-bold tracking-tighter mb-8 border-b pb-4">
            최신 인사이트
            <span className="text-lg font-normal text-muted-foreground ml-4">따끈따끈한 해외 반응</span>
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>데이터를 불러오는 중입니다... (크롤러가 열심히 일하고 있어요! 🐜)</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  )
}
