import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const origin = `${url.protocol}//${url.host}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const emailRedirectTo = `${origin}/auth/callback?next=%2Fdashboard`

    const diagnostics = {
      supabaseUrlPresent: Boolean(supabaseUrl),
      anonKeyPresent: Boolean(anonKey),
      serviceRolePresent: Boolean(serviceKey),
      emailRedirectTo,
      notes: [
        'Confirm Supabase Auth email templates are enabled and domain is verified.',
        'Ensure Auth > URL configuration matches this environment origin.',
        'The app uses emailRedirectTo shown above for signup/confirmation.',
      ],
    }

    return NextResponse.json({ ok: true, diagnostics })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}



