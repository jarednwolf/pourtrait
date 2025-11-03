import { NextRequest, NextResponse } from 'next/server'
import { mapFreeTextToProfile } from '@/lib/profile/llm-mapper'
import { evaluateProfile } from '@/lib/profile/evaluator'
import { createClient } from '@supabase/supabase-js'

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
    if (!isNaN(lastTs) && now - lastTs < 4_000) {
      return NextResponse.json({ error: 'Too many requests', retryAfterMs: 4000 - (now - lastTs) }, { status: 429 })
    }

    const startedAt = Date.now()
    const anonUserId = `preview-${now}`
    console.log('preview_map_started', { experience })

    const { profile, summary, usedModel } = await mapFreeTextToProfile({
      userId: anonUserId,
      experience,
      answers: freeTextAnswers || {}
    })

    const latencyMs = Date.now() - startedAt
    console.log('preview_map_completed', { latencyMs })

    const evalRes = evaluateProfile(profile, freeTextAnswers, experience)

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const answersStr = JSON.stringify(freeTextAnswers || {})
      const excerpt = answersStr.slice(0, 160)
      await supabase.from('llm_mapping_runs').insert({
        user_id: null,
        anon_id: anonUserId,
        model: usedModel,
        prompt_version: process.env.NEXT_PUBLIC_PROMPT_VERSION || null,
        evaluator_version: process.env.NEXT_PUBLIC_EVALUATOR_VERSION || null,
        experience,
        latency_ms: latencyMs,
        confidence: evalRes.confidence,
        success: true,
        answers_excerpt: excerpt,
        answers_hash: null,
        checks: process.env.NEXT_PUBLIC_SHOW_EVAL_DIAGNOSTICS ? (evalRes.checks as any) : null
      })
    } catch {}

    const res = NextResponse.json({ success: true, data: { profile, summary, evaluation: { confidence: evalRes.confidence, checks: process.env.NEXT_PUBLIC_SHOW_EVAL_DIAGNOSTICS ? evalRes.checks : undefined }, commentary: evalRes.commentary } })
    res.cookies.set('pp_preview_ts', String(now), { httpOnly: false, sameSite: 'lax', maxAge: 60 * 5 })
    return res
  } catch (error) {
    const err: any = error
    const payload = {
      error: 'preview_map_failed',
      code: err?.code || err?.status || err?.name || 'unknown',
      message: err?.message || 'Unknown error',
      outputSample: err?.outputSample,
    }
    console.error('preview_map_failed', payload)
    return NextResponse.json(payload, { status: 500 })
  }
}


