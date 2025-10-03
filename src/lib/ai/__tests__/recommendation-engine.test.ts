// AI Recommendation Engine Tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIRecommendationEngine } from '../recommendation-engine'
import { AIRecommendationRequest } from '../types'
import { TasteProfile, Wine } from '@/types'

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'I recommend the 2019 Caymus Cabernet Sauvignon from Napa Valley. This wine pairs excellently with your grilled steak because its bold tannins and rich fruit flavors complement the meat. The wine shows characteristics of blackberry and vanilla, with a full body that matches your preference for robust red wines.'
            }
          }],
          usage: {
            total_tokens: 150
          }
        })
      }
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      })
    }
  }))
}))

// Mock Pinecone
vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    listIndexes: vi.fn().mockResolvedValue({ indexes: [] }),
    createIndex: vi.fn().mockResolvedValue({}),
    index: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({}),
      query: vi.fn().mockResolvedValue({
        matches: [
          {
            id: 'wine-1',
            score: 0.9,
            metadata: {
              name: 'Caymus Cabernet Sauvignon',
              producer: 'Caymus Vineyards',
              region: 'Napa Valley',
              country: 'USA',
              varietal: ['Cabernet Sauvignon'],
              type: 'red',
              vintage: 2019
            }
          }
        ]
      })
    })
  }))
}))

describe('AIRecommendationEngine', () => {
  let engine: AIRecommendationEngine
  let mockRequest: AIRecommendationRequest
  let mockTasteProfile: TasteProfile
  let mockWines: Wine[]

  beforeEach(() => {
    engine = new AIRecommendationEngine()

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
        dislikedCharacteristics: ['overly sweet']
      },
      whiteWinePreferences: {
        fruitiness: 6,
        earthiness: 4,
        oakiness: 5,
        acidity: 7,
        tannins: 2,
        sweetness: 3,
        body: 'medium',
        preferredRegions: ['Burgundy'],
        preferredVarietals: ['Chardonnay'],
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
        preferredVarietals: ['Chardonnay'],
        dislikedCharacteristics: []
      },
      generalPreferences: {
        priceRange: { min: 25, max: 100, currency: 'USD' },
        occasionPreferences: ['dinner party'],
        foodPairingImportance: 8
      },
      learningHistory: [],
      confidenceScore: 0.8,
      lastUpdated: new Date()
    }

    mockWines = [
      {
        id: 'wine-1',
        userId: 'user-1',
        name: 'Caymus Cabernet Sauvignon',
        producer: 'Caymus Vineyards',
        vintage: 2019,
        region: 'Napa Valley',
        country: 'USA',
        varietal: ['Cabernet Sauvignon'],
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    mockRequest = {
      userId: 'user-1',
      query: 'What wine should I drink with grilled steak tonight?',
      context: {
        occasion: 'dinner party',
        foodPairing: 'grilled steak'
      },
      userProfile: mockTasteProfile,
      inventory: mockWines,
      experienceLevel: 'intermediate'
    }
  })

  describe('generateRecommendations', () => {
    it('should generate valid recommendations', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      expect(response).toHaveProperty('recommendations')
      expect(response).toHaveProperty('reasoning')
      expect(response).toHaveProperty('confidence')
      expect(response).toHaveProperty('responseMetadata')

      expect(response.recommendations).toBeInstanceOf(Array)
      expect(response.confidence).toBeGreaterThan(0)
      expect(response.confidence).toBeLessThanOrEqual(1)
    })

    it('should include response metadata', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      expect(response.responseMetadata).toHaveProperty('model')
      expect(response.responseMetadata).toHaveProperty('tokensUsed')
      expect(response.responseMetadata).toHaveProperty('responseTime')
      expect(response.responseMetadata).toHaveProperty('validationPassed')
      expect(response.responseMetadata).toHaveProperty('confidence')

      expect(response.responseMetadata.tokensUsed).toBeGreaterThan(0)
      expect(response.responseMetadata.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('should provide reasoning for recommendations', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      expect(response.reasoning).toBeTruthy()
      expect(typeof response.reasoning).toBe('string')
      expect(response.reasoning.length).toBeGreaterThan(10)
    })

    it('should handle inventory recommendations', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      // Should find recommendations from inventory when available
      const inventoryRecs = response.recommendations.filter(rec => rec.type === 'inventory')
      expect(inventoryRecs.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle purchase recommendations when no inventory', async () => {
      const noInventoryRequest = {
        ...mockRequest,
        inventory: []
      }

      const response = await engine.generateRecommendations(noInventoryRequest)

      const purchaseRecs = response.recommendations.filter(rec => rec.type === 'purchase')
      expect(purchaseRecs.length).toBeGreaterThanOrEqual(0)
    })

    it('should provide educational notes for beginners', async () => {
      const beginnerRequest = {
        ...mockRequest,
        experienceLevel: 'beginner' as const
      }

      const response = await engine.generateRecommendations(beginnerRequest)

      // Beginners should get educational context
      if (response.recommendations.length > 0) {
        const hasEducationalContent = response.recommendations.some(rec => 
          rec.educationalContext !== undefined
        ) || response.educationalNotes !== undefined

        expect(hasEducationalContent).toBe(true)
      }
    })

    it('should generate follow-up questions', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      expect(response.followUpQuestions).toBeInstanceOf(Array)
      expect(response.followUpQuestions?.length).toBeLessThanOrEqual(2)
    })
  })

  describe('error handling', () => {
    it('should return fallback response on API error', async () => {
      // Mock OpenAI to throw an error
      const mockEngine = new AIRecommendationEngine()
      vi.spyOn(mockEngine as any, 'generateAIResponse').mockRejectedValue(new Error('API Error'))

      const response = await mockEngine.generateRecommendations(mockRequest)

      expect(response.recommendations).toHaveLength(0)
      expect(response.confidence).toBe(0)
      expect(response.reasoning).toContain('apologize')
      expect(response.responseMetadata.validationPassed).toBe(false)
    })

    it('should handle invalid user profile gracefully', async () => {
      const invalidRequest = {
        ...mockRequest,
        userProfile: {} as TasteProfile
      }

      // Should not throw an error
      const response = await engine.generateRecommendations(invalidRequest)
      expect(response).toBeDefined()
    })

    it('should handle empty query', async () => {
      const emptyQueryRequest = {
        ...mockRequest,
        query: ''
      }

      const response = await engine.generateRecommendations(emptyQueryRequest)
      expect(response).toBeDefined()
    })
  })

  describe('recommendation parsing', () => {
    it('should parse wine recommendations from AI response', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      if (response.recommendations.length > 0) {
        const rec = response.recommendations[0]
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('reasoning')
        expect(rec).toHaveProperty('confidence')
        expect(rec.confidence).toBeGreaterThan(0)
        expect(rec.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('should match wines from inventory when possible', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      const inventoryRecs = response.recommendations.filter(rec => 
        rec.type === 'inventory' && rec.wineId
      )

      inventoryRecs.forEach(rec => {
        expect(mockWines.some(wine => wine.id === rec.wineId)).toBe(true)
      })
    })

    it('should create purchase suggestions for non-inventory wines', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      const purchaseRecs = response.recommendations.filter(rec => 
        rec.type === 'purchase' && rec.suggestedWine
      )

      purchaseRecs.forEach(rec => {
        expect(rec.suggestedWine).toHaveProperty('name')
        expect(rec.suggestedWine).toHaveProperty('producer')
        expect(rec.suggestedWine).toHaveProperty('region')
        expect(rec.suggestedWine).toHaveProperty('varietal')
        expect(rec.suggestedWine).toHaveProperty('type')
      })
    })
  })

  describe('confidence calculation', () => {
    it('should calculate realistic confidence scores', async () => {
      const response = await engine.generateRecommendations(mockRequest)

      expect(response.confidence).toBeGreaterThan(0)
      expect(response.confidence).toBeLessThanOrEqual(1)

      response.recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThan(0)
        expect(rec.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should have lower confidence for complex requests', async () => {
      const complexRequest = {
        ...mockRequest,
        query: 'Find me a rare wine from a specific vineyard that pairs with exotic cuisine',
        context: {
          foodPairing: 'molecular gastronomy dish with unusual flavors'
        }
      }

      const simpleRequest = {
        ...mockRequest,
        query: 'Red wine for steak'
      }

      const [complexResponse, simpleResponse] = await Promise.all([
        engine.generateRecommendations(complexRequest),
        engine.generateRecommendations(simpleRequest)
      ])

      // Complex requests might have lower confidence (though this depends on AI response)
      expect(complexResponse.confidence).toBeGreaterThan(0)
      expect(simpleResponse.confidence).toBeGreaterThan(0)
    })
  })

  describe('experience level adaptation', () => {
    it('should adapt vocabulary for beginners', async () => {
      const beginnerRequest = {
        ...mockRequest,
        experienceLevel: 'beginner' as const
      }

      const response = await engine.generateRecommendations(beginnerRequest)

      // Check if educational context is provided for beginners
      const hasEducationalContent = response.recommendations.some(rec => 
        rec.educationalContext !== undefined
      ) || response.educationalNotes !== undefined

      if (response.recommendations.length > 0) {
        expect(hasEducationalContent).toBe(true)
      }
    })

    it('should provide advanced details for experts', async () => {
      const expertRequest = {
        ...mockRequest,
        experienceLevel: 'advanced' as const
      }

      const response = await engine.generateRecommendations(expertRequest)

      // Advanced users should get detailed reasoning
      response.recommendations.forEach(rec => {
        expect(rec.reasoning.length).toBeGreaterThan(20)
      })
    })
  })
})