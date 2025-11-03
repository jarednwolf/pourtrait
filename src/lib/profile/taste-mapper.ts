import type { TasteProfile, FlavorProfile } from '@/types'

function toScale10(value: number | undefined, fallback = 0.5): number {
  const v = typeof value === 'number' ? value : fallback
  const n = Math.round(Math.max(0, Math.min(1, v)) * 9) + 1
  return Math.max(1, Math.min(10, n))
}

function toBody(value: number | undefined): 'light' | 'medium' | 'full' {
  const v = typeof value === 'number' ? value : 0.5
  if (v < 0.4) return 'light'
  if (v > 0.7) return 'full'
  return 'medium'
}

function buildFlavorProfile(
  base: any,
  palate: any,
  dislikes: string[] | null | undefined
): FlavorProfile {
  return {
    fruitiness: toScale10(base?.fruitRipeness, 0.5),
    earthiness: toScale10(base?.earthiness ?? base?.minerality, 0.5),
    oakiness: toScale10(base?.oak ?? palate?.oak, 0.3),
    acidity: toScale10(palate?.acidity, 0.5),
    tannins: toScale10(palate?.tannin, 0.5),
    sweetness: toScale10(palate?.sweetness, 0.3),
    body: toBody(palate?.body),
    preferredRegions: Array.isArray(base?.preferredRegions) ? base.preferredRegions : [],
    preferredVarietals: Array.isArray(base?.preferredVarietals) ? base.preferredVarietals : [],
    dislikedCharacteristics: Array.isArray(dislikes) ? dislikes : []
  }
}

export async function loadTasteProfileFromPalate(supabase: any, userId: string): Promise<TasteProfile> {
  const { data: palate } = await supabase
    .from('palate_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const nowIso = new Date().toISOString()
  const flavorMaps = (palate?.flavor_maps as any) || {}
  const redBase = flavorMaps.red || {}
  const whiteBase = flavorMaps.white || {}
  const sparklingBase = flavorMaps.sparkling || {}

  const red = buildFlavorProfile(redBase, palate, palate?.dislikes)
  const white = buildFlavorProfile(whiteBase, palate, palate?.dislikes)
  const sparkling = buildFlavorProfile(sparklingBase, palate, palate?.dislikes)

  // General preferences: attempt to infer price range from budget_tier
  const budget = String(palate?.budget_tier || '').toLowerCase()
  const priceRange = budget === 'weekday' ? { min: 10, max: 25, currency: 'USD' }
    : budget === 'weekend' ? { min: 20, max: 50, currency: 'USD' }
    : budget === 'splurge' ? { min: 50, max: 150, currency: 'USD' }
    : { min: 15, max: 40, currency: 'USD' }

  const profile: TasteProfile = {
    userId,
    redWinePreferences: red,
    whiteWinePreferences: white,
    sparklingPreferences: sparkling,
    generalPreferences: {
      priceRange,
      occasionPreferences: [],
      foodPairingImportance: 5,
      // Note: These additional fields exist only in the DB-focused palate model,
      // so we keep the app-facing type minimal here.
    } as any,
    learningHistory: [],
    confidenceScore: typeof palate?.confidence_score === 'number' ? palate.confidence_score : 0.8,
    lastUpdated: new Date(palate?.updated_at || nowIso)
  }

  return profile
}



