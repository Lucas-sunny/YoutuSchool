import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

function getHeaders() {
    return {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
}

// GET /api/admin/users - 전체 회원 목록
export async function GET() {
    if (!SERVICE_KEY) {
        return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?order=created_at.desc`,
        { headers: getHeaders() }
    )

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
}

// PATCH /api/admin/users - 회원 상태 변경
export async function PATCH(request: Request) {
    if (!SERVICE_KEY) {
        return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const { id, status } = await request.json()
    if (!id || !status) {
        return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        }
    )

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
}
