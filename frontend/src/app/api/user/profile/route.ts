import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// GET /api/user/profile?id={userId}
export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    if (!SERVICE_KEY) {
        // 환경변수 없으면 anon key로 시도
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${id}&select=*`,
            {
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                }
            }
        )
        if (!res.ok) return NextResponse.json(null)
        const data = await res.json()
        return NextResponse.json(data[0] ?? null)
    }

    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${id}&select=*`,
        {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            }
        }
    )

    if (!res.ok) return NextResponse.json(null)
    const data = await res.json()
    return NextResponse.json(data[0] ?? null)
}
