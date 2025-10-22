import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AIRecommendationEngine } from '@/lib/ai/recommendation-engine'

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

    const [{ data: profile }, { data: aromas }, { data: contexts }] = await Promise.all([
      supabase.from('palate_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('aroma_preferences').select('*').eq('user_id', user.id),
      supabase.from('context_preferences').select('*').eq('user_id', user.id)
    ])

    const engine = new AIRecommendationEngine()
    const summaryPrompt = `Summarize this user's wine palate into 3 concise bullets for red, white, and sparkling.
Profile: ${JSON.stringify(profile)}
Aromas: ${JSON.stringify(aromas)}
Contexts: ${JSON.stringify(contexts)}
Keep it actionable and friendly.`

    const ai = await engine.generateRecommendations({
      userId: user.id,
      type: 'contextual',
      context: { occasion: 'profile_summary' } as any,
      inventory: [],
      tasteProfile: {
        userId: user.id,
        redWinePreferences: { body: 'medium', fruitiness: 6, earthiness: 5, oakiness: 5, acidity: 6, tannins: 6, sweetness: 2, preferredRegions: [], preferredVarietals: [], dislikedCharacteristics: [] },
        whiteWinePreferences: { body: 'medium', fruitiness: 6, earthiness: 3, oakiness: 3, acidity: 7, tannins: 1, sweetness: 3, preferredRegions: [], preferredVarietals: [], dislikedCharacteristics: [] },
        sparklingPreferences: { body: 'light', fruitiness: 6, earthiness: 3, oakiness: 2, acidity: 8, tannins: 1, sweetness: 2, preferredRegions: [], preferredVarietals: [], dislikedCharacteristics: [] },
        generalPreferences: { priceRange: { min: 0, max: 50, currency: 'USD' }, occasionPreferences: [], foodPairingImportance: 5 },
        learningHistory: [],
        confidenceScore: 0.7,
        lastUpdated: new Date()
      }
    } as any)

    return NextResponse.json({ success: true, data: { summary: ai.reasoning } })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


