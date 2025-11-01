import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

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

    const { data: profile } = await supabase
      .from('palate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: aromas } = await supabase
      .from('aroma_preferences')
      .select('*')
      .eq('user_id', user.id)

    const { data: contexts } = await supabase
      .from('context_preferences')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, data: { profile, aromas, contexts } })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

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

    const [{ data: profile }, { data: aromas }, { data: contexts }, { data: food }] = await Promise.all([
      supabase.from('palate_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('aroma_preferences').select('*').eq('user_id', user.id),
      supabase.from('context_preferences').select('*').eq('user_id', user.id),
      supabase.from('food_profiles').select('*').eq('user_id', user.id).single()
    ])

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const candidates = [process.env.OPENAI_MODEL, 'gpt-4o-mini', 'gpt-4o'].filter(Boolean) as string[]

    const input = {
      palette: profile || {},
      topAromas: (aromas || []).slice(0, 3),
      topContexts: (contexts || []).slice(0, 3),
      food: food || null,
    }

    const system = [
      'You are a sommelier summarizer.',
      'Given normalized palate values (0..1), style levers, dislikes, and top aromas/contexts, write a concise 2-3 sentence summary.',
      'Mention notable highs and any explicit dislikes. No emojis. Keep it friendly and clear.',
    ].join('\n')

    let summary = ''
    let lastErr: any = null
    for (const m of candidates) {
      try {
        const completion = await openai.chat.completions.create({
          model: m,
          temperature: 0.2,
          max_tokens: 200,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: JSON.stringify(input) }
          ]
        })
        summary = completion.choices?.[0]?.message?.content || ''
        if (summary) break
      } catch (err) {
        lastErr = err
      }
    }
    if (!summary) {
      console.error('profile_summary_model_failed', { error: lastErr?.message || lastErr })
      return NextResponse.json({ error: 'model_error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { summary } })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


