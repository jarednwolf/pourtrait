import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
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

    const userId = user.id
    const profile = body

    // Upsert palate profile
    await supabase.from('palate_profiles').upsert({
      user_id: userId,
      sweetness: profile.stablePalate?.sweetness,
      acidity: profile.stablePalate?.acidity,
      tannin: profile.stablePalate?.tannin,
      bitterness: profile.stablePalate?.bitterness,
      body: profile.stablePalate?.body,
      alcohol_warmth: profile.stablePalate?.alcoholWarmth,
      sparkle_intensity: profile.stablePalate?.sparkleIntensity,
      oak: profile.styleLevers?.oak,
      malolactic_butter: profile.styleLevers?.malolacticButter,
      oxidative: profile.styleLevers?.oxidative,
      minerality: profile.styleLevers?.minerality,
      fruit_ripeness: profile.styleLevers?.fruitRipeness,
      sparkling_dryness: profile.sparkling?.drynessBand,
      wine_knowledge: profile.wineKnowledge,
      novelty: profile.preferences?.novelty,
      budget_tier: profile.preferences?.budgetTier,
      dislikes: profile.dislikes || [],
      flavor_maps: profile.flavorMaps || {},
      updated_at: new Date().toISOString()
    })

    // Replace aroma preferences
    if (Array.isArray(profile.aromaAffinities)) {
      await supabase.from('aroma_preferences').delete().eq('user_id', userId)
      if (profile.aromaAffinities.length > 0) {
        await supabase.from('aroma_preferences').insert(
          profile.aromaAffinities.map((a: any) => ({ user_id: userId, family: a.family, affinity: a.affinity }))
        )
      }
    }

    // Replace context preferences
    if (Array.isArray(profile.contextWeights)) {
      await supabase.from('context_preferences').delete().eq('user_id', userId)
      if (profile.contextWeights.length > 0) {
        await supabase.from('context_preferences').insert(
          profile.contextWeights.map((c: any) => ({ user_id: userId, occasion: c.occasion, weights: c.weights }))
        )
      }
    }

    // Upsert food profile if present
    if (profile.foodProfile) {
      await supabase.from('food_profiles').upsert({
        user_id: userId,
        heat_level: profile.foodProfile.heatLevel,
        salt: profile.foodProfile.salt,
        fat: profile.foodProfile.fat,
        sauce_sweetness: profile.foodProfile.sauceSweetness,
        sauce_acidity: profile.foodProfile.sauceAcidity,
        cuisines: profile.foodProfile.cuisines,
        proteins: profile.foodProfile.proteins,
        updated_at: new Date().toISOString()
      })
    }

    // Mark onboarding as completed and ensure user profile row exists
    try {
      const mappedExperience = profile.wineKnowledge === 'novice'
        ? 'beginner'
        : profile.wineKnowledge === 'expert'
          ? 'advanced'
          : profile.wineKnowledge
      await supabase
        .from('user_profiles')
        .upsert({ id: userId, onboarding_completed: true, experience_level: mappedExperience })
    } catch {}

    // Legacy backfill removed after migration to palate_profiles readers

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


