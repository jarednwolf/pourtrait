import { NextRequest, NextResponse } from 'next/server'
import { mapFreeTextToProfile } from '@/lib/profile/llm-mapper'
import { createClient } from '@supabase/supabase-js'
import { evaluateProfile } from '@/lib/profile/evaluator'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { experience, freeTextAnswers } = body || {}

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const startedAt = Date.now()
    console.log('llm_map_started', { userId: user.id, experience })

    const { profile, summary } = await mapFreeTextToProfile({
      userId: user.id,
      experience,
      answers: freeTextAnswers || {}
    })

    const latencyMs = Date.now() - startedAt
    console.log('llm_map_completed', { userId: user.id, latencyMs })

    const evalRes = evaluateProfile(profile, freeTextAnswers, experience)
    return NextResponse.json({ success: true, data: { profile, summary, evaluation: { confidence: evalRes.confidence, checks: process.env.NEXT_PUBLIC_SHOW_EVAL_DIAGNOSTICS ? evalRes.checks : undefined }, commentary: evalRes.commentary } })

  } catch (error) {
    console.error('llm_map_failed', { error: (error as any)?.message || String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


