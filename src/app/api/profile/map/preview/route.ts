import { NextRequest, NextResponse } from 'next/server'
import { mapFreeTextToProfile } from '@/lib/profile/llm-mapper'

export const runtime = 'nodejs'

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  cookieHeader.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=')
    if (k) out[k] = decodeURIComponent(rest.join('='))
  })
  return out
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { experience, freeTextAnswers } = body || {}
    if (!experience || typeof experience !== 'string') {
      return NextResponse.json({ error: 'experience is required' }, { status: 400 })
    }

    // Simple cookie-based throttle to avoid rapid repeats
    const cookies = parseCookies(request.headers.get('cookie'))
    const lastTs = Number(cookies['pp_preview_ts'] || '0')
    const now = Date.now()
    if (!isNaN(lastTs) && now - lastTs < 10_000) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const startedAt = Date.now()
    const anonUserId = `preview-${now}`
    console.log('preview_map_started', { experience })

    const { profile, summary } = await mapFreeTextToProfile({
      userId: anonUserId,
      experience,
      answers: freeTextAnswers || {}
    })

    const latencyMs = Date.now() - startedAt
    console.log('preview_map_completed', { latencyMs })

    const res = NextResponse.json({ success: true, data: { profile, summary } })
    res.cookies.set('pp_preview_ts', String(now), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 5 })
    return res
  } catch (error) {
    console.error('preview_map_failed', { error: (error as any)?.message || String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


