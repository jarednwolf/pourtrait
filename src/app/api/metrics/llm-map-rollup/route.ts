import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getDayRange(offsetDays = 1) {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(end.getTime() - offsetDays * 24 * 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString(), day: start.toISOString().slice(0, 10) }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const url = new URL(request.url)
    const offset = Number(url.searchParams.get('offset') || '1')
    const { start, end, day } = getDayRange(isNaN(offset) ? 1 : offset)

    const { data, error } = await supabase
      .from('llm_mapping_runs')
      .select('model, latency_ms, confidence, success, created_at')
      .gte('created_at', start)
      .lt('created_at', end)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = data?.length || 0
    const byModel: Record<string, any> = {}
    let sumLatency = 0
    let sumConf = 0
    let fails = 0
    for (const r of data || []) {
      byModel[r.model] = byModel[r.model] || { total: 0, sumLatency: 0, sumConf: 0, fails: 0 }
      byModel[r.model].total++
      byModel[r.model].sumLatency += r.latency_ms || 0
      byModel[r.model].sumConf += r.confidence || 0
      if (!r.success) { byModel[r.model].fails++ }
      sumLatency += r.latency_ms || 0
      sumConf += r.confidence || 0
      if (!r.success) { fails++ }
    }

    const models = Object.entries(byModel).map(([model, v]: any) => ({
      model,
      total: v.total,
      avg_latency_ms: v.total ? Math.round(v.sumLatency / v.total) : 0,
      avg_confidence: v.total ? Number((v.sumConf / v.total).toFixed(3)) : 0,
      failure_rate: v.total ? Number((v.fails / v.total).toFixed(3)) : 0
    }))

    const rollup = {
      day,
      total_runs: total,
      avg_latency_ms: total ? Math.round(sumLatency / total) : 0,
      avg_confidence: total ? Number((sumConf / total).toFixed(3)) : 0,
      failure_rate: total ? Number((fails / total).toFixed(3)) : 0,
      models
    }

    const { error: upErr } = await supabase
      .from('llm_daily_stats')
      .upsert(rollup, { onConflict: 'day' })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: rollup })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


