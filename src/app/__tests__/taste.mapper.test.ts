import { describe, it, expect } from 'vitest'
import { loadTasteProfileFromPalate } from '@/lib/profile/taste-mapper'

function makeSupabase(row: any) {
  return {
    from: (table: string) => {
      if (table !== 'palate_profiles') throw new Error('Unexpected table')
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: row })
          })
        })
      }
    }
  } as any
}

describe('taste-mapper loadTasteProfileFromPalate', () => {
  it('maps palate row to domain TasteProfile', async () => {
    const row = {
      user_id: 'u1',
      acidity: 0.6,
      tannin: 0.4,
      sweetness: 0.2,
      body: 0.5,
      flavor_maps: {
        red: { fruitRipeness: 0.7, oak: 0.3, preferredRegions: ['Bordeaux'], preferredVarietals: ['Merlot'] },
        white: { fruitRipeness: 0.5 },
        sparkling: { fruitRipeness: 0.4 }
      },
      budget_tier: 'weekday',
      confidence_score: 0.75,
      updated_at: new Date().toISOString()
    }
    const supabase = makeSupabase(row)
    const profile = await loadTasteProfileFromPalate(supabase, 'u1')
    expect(profile.userId).toBe('u1')
    expect(profile.redWinePreferences.preferredRegions).toContain('Bordeaux')
    expect(profile.generalPreferences.priceRange.min).toBeGreaterThan(0)
    expect(typeof profile.confidenceScore).toBe('number')
  })
})


