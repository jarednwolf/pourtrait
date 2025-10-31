import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const runtime = 'edge'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey)
}

async function getUserFromAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) { return null }
  const token = authHeader.replace('Bearer ', '')
  const supabase = getServiceClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromAuthHeader(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('wines')
      .select('drinking_window')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = data?.length || 0
    let readyNow = 0
    let readySoon = 0

    for (const row of data || []) {
      const dw: any = row.drinking_window
      const status = dw?.currentStatus
      if (status === 'at_peak') readyNow += 1
      else if (status === 'drink_soon') readySoon += 1
    }

    return NextResponse.json({ success: true, data: { total, readyNow, readySoon } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load inventory summary' }, { status: 500 })
  }
}


