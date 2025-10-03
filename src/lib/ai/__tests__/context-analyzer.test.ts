// Context Analyzer Tests

import { describe, it, expect, beforeEach } from 'vitest'
import { ContextAnalyzer } from '../context-analyzer'
import { AIRecommendationRequest } from '../types'
import { TasteProfile, Wine, RecommendationContext } from '@/types'

describe('ContextAnalyzer', () => {
  let mockTasteProfile: TasteProfile
  let mockWines: Wine[]
  let mockRequest: AIRecommendationRequest

  beforeEach(() => {
    mockTasteProfile = {
      userId: 'user-1',
      redWinePreferences: {
        fruitiness: 7,
        earthiness: 5,
        oakiness: 6,
        acidity: 5,
        tannins: 7,
        sweetness: 2,
        body: 'full',
        preferredRegions: ['Napa Valley', 'Bordeaux'],
        preferredVarietals: ['Cabernet Sauvignon', 'Merlot'],
        dislikedCharacteristics: ['overly sweet', 'too light']
      },
      whiteWinePreferences: {
        fruitiness: 6,
        earthiness: 4,
        oakiness: 5,
        acidity: 7,
        tannins: 2,
        sweetness: 3,
        body: 'medium',
        preferredRegions: ['Burgundy', 'Sonoma'],
        preferredVarietals: ['Chardonnay', 'Sauvignon Blanc'],
        dislikedCharacteristics: ['too oaky']
      },
      sparklingPreferences: {
        fruitiness: 5,
        earthiness: 3,
        oakiness: 2,
        acidity: 8,
        tannins: 1,
        sweetness: 4,
        body: 'light',
        preferredRegions: ['Champagne'],
        preferredVarietals: ['Chardonnay', 'Pinot Noir'],
        dislikedCharacteristics: ['too sweet']
      },
      generalPreferences: {
        priceRange: { min: 25, max: 100, currency: 'USD' },
        occasionPreferences: ['dinner party', 'romantic dinner'],
        foodPairingImportance: 8
      },
      learningHistory: [
        {
          wineId: 'wine-1',
          rating: 4,
          notes: 'Great with steak',
          characteristics: ['bold', 'tannic'],
          tastedAt: new Date('2024-01-15')
        }
      ],
      confidenceScore: 0.8,
      lastUpdated: new Date('2024-01-20')
    }

    mockWines = [
      {
        id: 'wine-1',
        userId: 'user-1',
        name: 'Opus One',
        producer: 'Opus One Winery',
        vintage: 2019,
        region: 'Napa Valley',
        country: 'USA',
        varietal: ['Cabernet Sauvignon', 'Merlot'],
        type: 'red',
        quantity: 2,
        drinkingWindow: {
          earliestDate: new Date('2024-01-01'),
          peakStartDate: new Date('2024-06-01'),
          peakEndDate: new Date('2026-06-01'),
          latestDate: new Date('2030-01-01'),
          currentStatus: 'ready'
        },
        externalData: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]

    mockRequest = {
      userId: 'user-1',
      query: 'What should I drink with dinner tonight?',
      context: {
        occasion: 'dinner party',
        foodPairing: 'grilled steak'
      },
      userProfile: mockTasteProfile,
      inventory: mockWines,
      experienceLevel: 'intermediate'
    }
  })

  describe('analyzeContext', () => {
    it('should analyze complete context correctly', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis).toHaveProperty('occasion')
      expect(analysis).toHaveProperty('foodPairing')
      expect(analysis).toHaveProperty('preferences')
      expect(analysis).toHaveProperty('constraints')
      expect(analysis).toHaveProperty('urgency')
    })

    it('should handle missing context gracefully', () => {
      const requestWithoutContext = {
        ...mockRequest,
        context: {},
        query: 'Recommend a wine'
      }

      const analysis = ContextAnalyzer.analyzeContext(requestWithoutContext)

      expect(analysis.occasion.type).toBe('general')
      expect(analysis.occasion.formality).toBe('casual')
    })
  })

  describe('occasion analysis', () => {
    it('should identify dinner party occasion', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.occasion.type).toBe('dinner_party')
      expect(analysis.occasion.formality).toBe('semi_formal')
      expect(analysis.occasion.companionCount).toBe(1) // Default when no companions specified
    })

    it('should identify romantic dinner from query', () => {
      const romanticRequest = {
        ...mockRequest,
        query: 'What wine for a romantic dinner?',
        context: {}
      }

      const analysis = ContextAnalyzer.analyzeContext(romanticRequest)

      expect(analysis.occasion.type).toBe('romantic_dinner')
      expect(analysis.occasion.formality).toBe('semi_formal')
    })

    it('should identify celebration occasion', () => {
      const celebrationRequest = {
        ...mockRequest,
        query: 'Wine for anniversary celebration',
        context: { occasion: 'celebration' }
      }

      const analysis = ContextAnalyzer.analyzeContext(celebrationRequest)

      expect(analysis.occasion.type).toBe('celebration')
      expect(analysis.occasion.formality).toBe('formal')
    })

    it('should detect time of day from query', () => {
      const lunchRequest = {
        ...mockRequest,
        query: 'Wine for lunch today'
      }

      const analysis = ContextAnalyzer.analyzeContext(lunchRequest)

      expect(analysis.occasion.timeOfDay).toBe('afternoon')
    })

    it('should extract special considerations', () => {
      const specialRequest = {
        ...mockRequest,
        query: 'Wine to impress for anniversary dinner'
      }

      const analysis = ContextAnalyzer.analyzeContext(specialRequest)

      expect(analysis.occasion.specialConsiderations).toContain('anniversary')
      expect(analysis.occasion.specialConsiderations).toContain('impressive_selection')
    })
  })

  describe('food pairing analysis', () => {
    it('should extract main dish from context', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.foodPairing.mainDish).toBe('steak')
      expect(analysis.foodPairing.richness).toBe('rich')
    })

    it('should identify cooking method', () => {
      const grilledRequest = {
        ...mockRequest,
        context: { foodPairing: 'grilled salmon' }
      }

      const analysis = ContextAnalyzer.analyzeContext(grilledRequest)

      expect(analysis.foodPairing.cookingMethod).toBe('grilled')
      expect(analysis.foodPairing.mainDish).toBe('salmon')
    })

    it('should determine spice level', () => {
      const spicyRequest = {
        ...mockRequest,
        context: { foodPairing: 'spicy thai curry' }
      }

      const analysis = ContextAnalyzer.analyzeContext(spicyRequest)

      expect(analysis.foodPairing.spiceLevel).toBe('hot')
    })

    it('should extract cuisine type', () => {
      const italianRequest = {
        ...mockRequest,
        context: { foodPairing: 'italian pasta' }
      }

      const analysis = ContextAnalyzer.analyzeContext(italianRequest)

      expect(analysis.foodPairing.cuisine).toBe('italian')
    })

    it('should handle light dishes', () => {
      const lightRequest = {
        ...mockRequest,
        context: { foodPairing: 'steamed fish with salad' }
      }

      const analysis = ContextAnalyzer.analyzeContext(lightRequest)

      expect(analysis.foodPairing.richness).toBe('light')
      expect(analysis.foodPairing.cookingMethod).toBe('steamed')
    })
  })

  describe('preference analysis', () => {
    it('should analyze user taste profile', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.preferences.tasteProfile).toBe(mockTasteProfile)
      expect(analysis.preferences.recentConsumption).toHaveLength(1)
      expect(analysis.preferences.adventurousness).toBeGreaterThan(0)
    })

    it('should calculate adventurousness score', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.preferences.adventurousness).toBeTypeOf('number')
      expect(analysis.preferences.adventurousness).toBeGreaterThanOrEqual(1)
      expect(analysis.preferences.adventurousness).toBeLessThanOrEqual(10)
    })

    it('should extract disliked characteristics', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.preferences.dislikedWines).toContain('overly sweet')
      expect(analysis.preferences.dislikedWines).toContain('too light')
      expect(analysis.preferences.dislikedWines).toContain('too oaky')
    })
  })

  describe('constraint analysis', () => {
    it('should identify inventory-only availability', () => {
      const analysis = ContextAnalyzer.analyzeContext(mockRequest)

      expect(analysis.constraints.availability).toBe('inventory_only')
      expect(analysis.constraints.priceRange).toEqual(mockRequest.context.priceRange)
    })

    it('should default to purchase allowed when no inventory', () => {
      const noInventoryRequest = {
        ...mockRequest,
        inventory: undefined
      }

      const analysis = ContextAnalyzer.analyzeContext(noInventoryRequest)

      expect(analysis.constraints.availability).toBe('purchase_allowed')
    })
  })

  describe('urgency analysis', () => {
    it('should detect high urgency from immediate language', () => {
      const urgentRequest = {
        ...mockRequest,
        query: 'What should I drink tonight right now?'
      }

      const analysis = ContextAnalyzer.analyzeContext(urgentRequest)

      expect(analysis.urgency.level).toBe('high')
      expect(analysis.urgency.immediateNeed).toBe(true)
    })

    it('should detect low urgency from planning language', () => {
      const planningRequest = {
        ...mockRequest,
        query: 'Planning wine for next week dinner'
      }

      const analysis = ContextAnalyzer.analyzeContext(planningRequest)

      expect(analysis.urgency.level).toBe('low')
      expect(analysis.urgency.planningAhead).toBe(true)
    })

    it('should detect drinking window priority', () => {
      const decliningWine = {
        ...mockWines[0],
        drinkingWindow: {
          ...mockWines[0].drinkingWindow,
          currentStatus: 'declining' as const
        }
      }

      const urgentInventoryRequest = {
        ...mockRequest,
        inventory: [decliningWine]
      }

      const analysis = ContextAnalyzer.analyzeContext(urgentInventoryRequest)

      expect(analysis.urgency.drinkingWindowPriority).toBe(true)
    })

    it('should default to medium urgency', () => {
      const neutralRequest = {
        ...mockRequest,
        query: 'Recommend a wine for dinner'
      }

      const analysis = ContextAnalyzer.analyzeContext(neutralRequest)

      expect(analysis.urgency.level).toBe('medium')
    })
  })

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const emptyQueryRequest = {
        ...mockRequest,
        query: ''
      }

      const analysis = ContextAnalyzer.analyzeContext(emptyQueryRequest)

      expect(analysis.occasion.type).toBe('dinner_party') // From context
      expect(analysis.urgency.level).toBe('medium')
    })

    it('should handle missing taste profile data', () => {
      const minimalProfile = {
        ...mockTasteProfile,
        learningHistory: []
      }

      const minimalRequest = {
        ...mockRequest,
        userProfile: minimalProfile
      }

      const analysis = ContextAnalyzer.analyzeContext(minimalRequest)

      expect(analysis.preferences.adventurousness).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty inventory', () => {
      const emptyInventoryRequest = {
        ...mockRequest,
        inventory: []
      }

      const analysis = ContextAnalyzer.analyzeContext(emptyInventoryRequest)

      expect(analysis.constraints.availability).toBe('purchase_allowed')
      expect(analysis.urgency.drinkingWindowPriority).toBe(false)
    })
  })
})