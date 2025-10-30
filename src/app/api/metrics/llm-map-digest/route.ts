import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const days = Math.max(1, Math.min(30, Number(url.searchParams.get('days') || '7')))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('llm_mapping_runs')
      .select('model, latency_ms, confidence, success, created_at')
      .gte('created_at', since)

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

    const digest = {
      days,
      total_runs: total,
      avg_latency_ms: total ? Math.round(sumLatency / total) : 0,
      avg_confidence: total ? Number((sumConf / total).toFixed(3)) : 0,
      failure_rate: total ? Number((fails / total).toFixed(3)) : 0,
      models
    }

    return NextResponse.json({ success: true, data: digest })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


