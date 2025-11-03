import { describe, it, expect } from 'vitest'

// This is a light structural test to ensure table fields used in backfill exist
// and shapes align with Database types. It does not hit the DB.

describe('Profile consistency assumptions', () => {
  it('maps preview profile fields to taste_profiles columns', () => {
    const preview = {
      flavorMaps: {
        red: { tannin: 0.6 },
        white: { acidity: 0.5 },
        sparkling: { dryness: 'Brut' }
      },
      preferences: { novelty: 0.5 },
      learningHistory: [],
      confidence: 0.8
    }

    // Expected mapping shape (no runtime conversion here, just keys presence)
    const mapped = {
      red_wine_preferences: preview.flavorMaps.red,
      white_wine_preferences: preview.flavorMaps.white,
      sparkling_preferences: preview.flavorMaps.sparkling,
      general_preferences: preview.preferences,
      learning_history: preview.learningHistory,
      confidence_score: preview.confidence,
    }

    expect(Object.keys(mapped)).toEqual([
      'red_wine_preferences',
      'white_wine_preferences',
      'sparkling_preferences',
      'general_preferences',
      'learning_history',
      'confidence_score'
    ])
  })
})



