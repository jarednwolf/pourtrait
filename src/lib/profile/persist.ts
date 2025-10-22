import { createClient } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/profile'

export async function upsertUserProfile(userId: string, profile: UserProfile) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Upsert main palate profile
  await supabase.from('palate_profiles').upsert({
    user_id: userId,
    sweetness: profile.stablePalate.sweetness,
    acidity: profile.stablePalate.acidity,
    tannin: profile.stablePalate.tannin,
    bitterness: profile.stablePalate.bitterness,
    body: profile.stablePalate.body,
    alcohol_warmth: profile.stablePalate.alcoholWarmth,
    sparkle_intensity: profile.stablePalate.sparkleIntensity,
    oak: profile.styleLevers.oak,
    malolactic_butter: profile.styleLevers.malolacticButter,
    oxidative: profile.styleLevers.oxidative,
    minerality: profile.styleLevers.minerality,
    fruit_ripeness: profile.styleLevers.fruitRipeness,
    sparkling_dryness: profile.sparkling.drynessBand,
    wine_knowledge: profile.wineKnowledge,
    novelty: profile.preferences.novelty,
    budget_tier: profile.preferences.budgetTier,
    dislikes: profile.dislikes,
    flavor_maps: profile.flavorMaps,
    updated_at: new Date().toISOString()
  })

  // Replace aroma preferences
  if (profile.aromaAffinities?.length) {
    await supabase.from('aroma_preferences').delete().eq('user_id', userId)
    await supabase.from('aroma_preferences').insert(
      profile.aromaAffinities.map(a => ({ user_id: userId, family: a.family, affinity: a.affinity }))
    )
  }

  // Replace context preferences
  if (profile.contextWeights?.length) {
    await supabase.from('context_preferences').delete().eq('user_id', userId)
    await supabase.from('context_preferences').insert(
      profile.contextWeights.map(c => ({ user_id: userId, occasion: c.occasion, weights: c.weights }))
    )
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
}


