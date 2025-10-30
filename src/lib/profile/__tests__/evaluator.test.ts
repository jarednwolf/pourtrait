import { describe, it, expect } from 'vitest'
import { evaluateProfile } from '../../profile/evaluator'

const baseProfile = {
  userId: 'u',
  stablePalate: {
    sweetness: 0.2,
    acidity: 0.5,
    tannin: 0.75,
    bitterness: 0.45,
    body: 0.75,
    alcoholWarmth: 0.7,
    sparkleIntensity: 0.2
  },
  aromaAffinities: [],
  styleLevers: { oak: 0.6, malolacticButter: 0.3, oxidative: 0.3, minerality: 0.6, fruitRipeness: 0.6 },
  contextWeights: [
    { occasion: 'steak_night', weights: {} },
    { occasion: 'pizza_pasta', weights: {} },
    { occasion: 'celebration_toast', weights: {} }
  ],
  foodProfile: undefined,
  preferences: { novelty: 0.4, budgetTier: 'weekend', values: [] },
  dislikes: [],
  sparkling: {},
  wineKnowledge: 'expert',
  flavorMaps: {
    red: { tannin: 0.75, acidity: 0.5, body: 0.75, oak: 0.6, fruitRipeness: 0.6 },
    white: { acidity: 0.55, body: 0.5, oak: 0.2, aromaAffinitiesTop: ['citrus'] },
    sparkling: { dryness: 'Brut', bubbleIntensity: 0.2 }
  }
}

describe('evaluateProfile', () => {
  it('scores high confidence for structured reds with balanced whites', () => {
    const text = {
      free_enjoyed: 'Napa Cabernet (Heitz), Northern Rhone Syrah, merlot-leaning Bordeaux; Pinot Gris comfort; Sancerre with seafood',
      free_disliked: 'overly acidic Italian wines, extremely acidic whites',
      free_contexts: 'steak dinner, grilled night, pizza and burgers, celebration, lunch rose',
    }
    const res = evaluateProfile(baseProfile as any, text, 'expert')
    expect(res.confidence).toBeGreaterThan(0.6)
    const failed = res.checks.filter(c => !c.ok)
    expect(failed.length).toBeLessThan(4)
    expect(res.commentary.length).toBeGreaterThan(20)
  })

  it('flags incoherent red tannin map', () => {
    const bad = JSON.parse(JSON.stringify(baseProfile))
    bad.flavorMaps.red.tannin = 0.2
    const res = evaluateProfile(bad as any, { free_enjoyed: 'Napa Cab' }, 'expert')
    const redTannin = res.checks.find(c => c.id === 'coherence-red-tannin')
    expect(redTannin?.ok).toBe(false)
    expect(res.confidence).toBeLessThan(0.8)
  })
})


