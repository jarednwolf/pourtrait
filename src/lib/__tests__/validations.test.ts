import { describe, it, expect } from 'vitest'
import {
  validateWineInput,
  validateUserRegistration,
  validateTastePreferences,
  validateInventoryFilters,
  validateRecommendationContext,
  wineInputSchema,
  userRegistrationSchema,
  tasteProfileSchema,
  flavorProfileSchema,
  drinkingWindowSchema,
  recommendationSchema,
  consumptionRecordSchema,
  inventoryFiltersSchema
} from '../validations'

describe('Wine Input Validation', () => {
  const validWineInput = {
    name: 'Château Margaux',
    producer: 'Château Margaux',
    vintage: 2015,
    region: 'Margaux',
    country: 'France',
    varietal: ['Cabernet Sauvignon', 'Merlot'],
    type: 'red' as const,
    quantity: 1,
    purchasePrice: 500.00,
    personalRating: 9
  }

  it('should validate correct wine input', () => {
    const result = validateWineInput(validWineInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Château Margaux')
      expect(result.data.varietal).toEqual(['Cabernet Sauvignon', 'Merlot'])
    }
  })

  it('should reject wine with empty name', () => {
    const result = validateWineInput({ ...validWineInput, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Wine name is required')
    }
  })

  it('should reject wine with invalid vintage', () => {
    const result = validateWineInput({ ...validWineInput, vintage: 1700 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Vintage too old')
    }
  })

  it('should reject wine with future vintage beyond limit', () => {
    const futureYear = new Date().getFullYear() + 10
    const result = validateWineInput({ ...validWineInput, vintage: futureYear })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Vintage cannot be more than 5 years in the future')
    }
  })

  it('should reject wine with negative quantity', () => {
    const result = validateWineInput({ ...validWineInput, quantity: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Quantity cannot be negative')
    }
  })

  it('should reject wine with invalid rating', () => {
    const result = validateWineInput({ ...validWineInput, personalRating: 11 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Number must be less than or equal to 10')
    }
  })

  it('should reject wine with empty varietal array', () => {
    const result = validateWineInput({ ...validWineInput, varietal: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one varietal is required')
    }
  })

  it('should accept wine with optional fields missing', () => {
    const minimalWine = {
      name: 'Simple Wine',
      producer: 'Simple Producer',
      vintage: 2020,
      region: 'Somewhere',
      country: 'France',
      varietal: ['Chardonnay'],
      type: 'white' as const,
      quantity: 1
    }
    const result = validateWineInput(minimalWine)
    expect(result.success).toBe(true)
  })
})

describe('User Registration Validation', () => {
  const validUserRegistration = {
    email: 'test@example.com',
    name: 'Test User',
    experienceLevel: 'beginner' as const
  }

  it('should validate correct user registration', () => {
    const result = validateUserRegistration(validUserRegistration)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@example.com')
      expect(result.data.experienceLevel).toBe('beginner')
    }
  })

  it('should reject invalid email', () => {
    const result = validateUserRegistration({ ...validUserRegistration, email: 'invalid-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid email address')
    }
  })

  it('should reject empty name', () => {
    const result = validateUserRegistration({ ...validUserRegistration, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Name is required')
    }
  })

  it('should reject invalid experience level', () => {
    const result = validateUserRegistration({ ...validUserRegistration, experienceLevel: 'expert' as any })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid enum value')
    }
  })
})

describe('Taste Profile Validation', () => {
  const validFlavorProfile = {
    fruitiness: 7,
    earthiness: 5,
    oakiness: 6,
    acidity: 8,
    tannins: 7,
    sweetness: 3,
    body: 'full' as const,
    preferredRegions: ['Bordeaux', 'Napa Valley'],
    preferredVarietals: ['Cabernet Sauvignon', 'Merlot'],
    dislikedCharacteristics: ['overly sweet', 'too tannic']
  }

  const validTasteProfile = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    redWinePreferences: validFlavorProfile,
    whiteWinePreferences: { ...validFlavorProfile, body: 'light' as const },
    sparklingPreferences: { ...validFlavorProfile, body: 'light' as const },
    generalPreferences: {
      priceRange: { min: 20, max: 100, currency: 'USD' },
      occasionPreferences: ['dinner', 'celebration'],
      foodPairingImportance: 8
    },
    learningHistory: [],
    confidenceScore: 0.7,
    lastUpdated: new Date().toISOString()
  }

  it('should validate correct taste profile', () => {
    const result = tasteProfileSchema.safeParse(validTasteProfile)
    expect(result.success).toBe(true)
  })

  it('should reject flavor profile with invalid scale values', () => {
    const invalidProfile = { ...validFlavorProfile, fruitiness: 11 }
    const result = flavorProfileSchema.safeParse(invalidProfile)
    expect(result.success).toBe(false)
  })

  it('should reject confidence score outside valid range', () => {
    const result = tasteProfileSchema.safeParse({ ...validTasteProfile, confidenceScore: 1.5 })
    expect(result.success).toBe(false)
  })

  it('should validate partial taste preferences', () => {
    const partialPreferences = {
      redWinePreferences: {
        fruitiness: 8,
        body: 'full' as const
      }
    }
    const result = validateTastePreferences(partialPreferences)
    expect(result.success).toBe(true)
  })
})

describe('Drinking Window Validation', () => {
  const validDrinkingWindow = {
    earliestDate: '2020-01-01',
    peakStartDate: '2022-01-01',
    peakEndDate: '2025-01-01',
    latestDate: '2030-01-01',
    currentStatus: 'ready' as const
  }

  it('should validate correct drinking window', () => {
    const result = drinkingWindowSchema.safeParse(validDrinkingWindow)
    expect(result.success).toBe(true)
  })

  it('should reject drinking window with dates out of order', () => {
    const invalidWindow = {
      ...validDrinkingWindow,
      peakStartDate: '2019-01-01' // Before earliest date
    }
    const result = drinkingWindowSchema.safeParse(invalidWindow)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('chronological order')
    }
  })

  it('should reject invalid status', () => {
    const result = drinkingWindowSchema.safeParse({ 
      ...validDrinkingWindow, 
      currentStatus: 'invalid' as any 
    })
    expect(result.success).toBe(false)
  })
})

describe('Recommendation Validation', () => {
  const validInventoryRecommendation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'inventory' as const,
    wineId: '123e4567-e89b-12d3-a456-426614174002',
    context: {
      occasion: 'dinner',
      foodPairing: 'steak'
    },
    reasoning: 'This wine pairs excellently with red meat and is at its peak drinking window.',
    confidence: 0.85,
    createdAt: new Date().toISOString()
  }

  const validPurchaseRecommendation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'purchase' as const,
    suggestedWine: {
      name: 'Recommended Wine',
      producer: 'Great Producer',
      region: 'Famous Region',
      varietal: ['Pinot Noir'],
      type: 'red' as const
    },
    context: {
      priceRange: { min: 30, max: 60, currency: 'USD' }
    },
    reasoning: 'Based on your taste profile, you would enjoy this wine.',
    confidence: 0.75,
    createdAt: new Date().toISOString()
  }

  it('should validate inventory recommendation', () => {
    const result = recommendationSchema.safeParse(validInventoryRecommendation)
    expect(result.success).toBe(true)
  })

  it('should validate purchase recommendation', () => {
    const result = recommendationSchema.safeParse(validPurchaseRecommendation)
    expect(result.success).toBe(true)
  })

  it('should reject inventory recommendation without wineId', () => {
    const { wineId, ...invalidRec } = validInventoryRecommendation
    const result = recommendationSchema.safeParse(invalidRec)
    expect(result.success).toBe(false)
  })

  it('should reject purchase recommendation without suggestedWine', () => {
    const { suggestedWine, ...invalidRec } = validPurchaseRecommendation
    const result = recommendationSchema.safeParse(invalidRec)
    expect(result.success).toBe(false)
  })

  it('should reject recommendation with confidence outside valid range', () => {
    const result = recommendationSchema.safeParse({ 
      ...validInventoryRecommendation, 
      confidence: 1.5 
    })
    expect(result.success).toBe(false)
  })
})

describe('Consumption Record Validation', () => {
  const validConsumptionRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    wineId: '123e4567-e89b-12d3-a456-426614174002',
    consumedAt: new Date().toISOString(),
    rating: 8,
    notes: 'Excellent wine with dinner',
    occasion: 'anniversary dinner',
    companions: ['spouse'],
    foodPairing: 'grilled salmon',
    createdAt: new Date().toISOString()
  }

  it('should validate correct consumption record', () => {
    const result = consumptionRecordSchema.safeParse(validConsumptionRecord)
    expect(result.success).toBe(true)
  })

  it('should reject consumption record with invalid rating', () => {
    const result = consumptionRecordSchema.safeParse({ 
      ...validConsumptionRecord, 
      rating: 11 
    })
    expect(result.success).toBe(false)
  })

  it('should accept consumption record with minimal required fields', () => {
    const minimalRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      wineId: '123e4567-e89b-12d3-a456-426614174002',
      consumedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    const result = consumptionRecordSchema.safeParse(minimalRecord)
    expect(result.success).toBe(true)
  })
})

describe('Inventory Filters Validation', () => {
  const validFilters = {
    type: ['red', 'white'] as const,
    region: ['Bordeaux', 'Napa Valley'],
    vintage: { min: 2010, max: 2020 },
    priceRange: { min: 20, max: 100, currency: 'USD' },
    drinkingWindowStatus: ['ready', 'peak'] as const,
    rating: { min: 7, max: 10 },
    search: 'Château',
    sortBy: 'vintage' as const,
    sortOrder: 'desc' as const
  }

  it('should validate correct inventory filters', () => {
    const result = validateInventoryFilters(validFilters)
    expect(result.success).toBe(true)
  })

  it('should reject filters with invalid vintage range', () => {
    const result = validateInventoryFilters({ 
      ...validFilters, 
      vintage: { min: 2020, max: 2010 } 
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum vintage must be greater than or equal to minimum')
    }
  })

  it('should reject filters with invalid rating range', () => {
    const result = validateInventoryFilters({ 
      ...validFilters, 
      rating: { min: 8, max: 5 } 
    })
    expect(result.success).toBe(false)
  })

  it('should accept empty filters object', () => {
    const result = validateInventoryFilters({})
    expect(result.success).toBe(true)
  })
})

describe('Recommendation Context Validation', () => {
  const validContext = {
    occasion: 'dinner party',
    foodPairing: 'grilled lamb',
    priceRange: { min: 40, max: 80, currency: 'USD' },
    urgency: 'medium' as const,
    companions: ['friends', 'family'],
    timeOfDay: 'evening' as const,
    season: 'fall' as const
  }

  it('should validate correct recommendation context', () => {
    const result = validateRecommendationContext(validContext)
    expect(result.success).toBe(true)
  })

  it('should accept partial context', () => {
    const partialContext = {
      occasion: 'casual dinner',
      urgency: 'low' as const
    }
    const result = validateRecommendationContext(partialContext)
    expect(result.success).toBe(true)
  })

  it('should reject invalid urgency level', () => {
    const result = validateRecommendationContext({ 
      ...validContext, 
      urgency: 'extreme' as any 
    })
    expect(result.success).toBe(false)
  })

  it('should accept empty context', () => {
    const result = validateRecommendationContext({})
    expect(result.success).toBe(true)
  })
})