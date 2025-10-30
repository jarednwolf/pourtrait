import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const key = request.headers.get('x-ingest-key')
    if (!key || key !== (process.env.METRICS_INGEST_KEY || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      model,
      latencyMs,
      confidence,
      success = true,
      experience,
      answers,
      checks,
      userId = null,
      anonId = null
    } = body || {}

    if (!model) {
      return NextResponse.json({ error: 'model required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const answersStr = typeof answers === 'string' ? answers : JSON.stringify(answers || {})
    const excerpt = answersStr.slice(0, 160)
    const salt = process.env.LLM_LOG_SALT || 'pourtrait'
    const answersHash = crypto.createHash('sha256').update(salt + answersStr).digest('hex')

    const { error } = await supabase.from('llm_mapping_runs').insert({
      user_id: userId,
      anon_id: anonId,
      model,
      prompt_version: process.env.NEXT_PUBLIC_PROMPT_VERSION || null,
      evaluator_version: process.env.NEXT_PUBLIC_EVALUATOR_VERSION || null,
      experience,
      latency_ms: latencyMs || null,
      confidence: typeof confidence === 'number' ? confidence : null,
      success: !!success,
      answers_excerpt: excerpt,
      answers_hash: answersHash,
      checks: checks || null
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


