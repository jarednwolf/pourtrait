// Personalized Recommendations Service Tests

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { 
  PersonalizedRecommendationService, 
  RecommendationFeedbackService,
  PersonalizedRecommendationRequest 
} from '../personalized-recommendations'
import { Wine, TasteProfile, RecommendationContext } from '@/types'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      order: vi.fn(() => ({
        limit: vi.fn()
      }))
    })),
    insert: vi.fn(),
    update: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
}

// Mock AI Engine
const mockAIEngine = {
  generateRecommendations: vi.fn()
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

vi.mock('@/lib/ai/recommendation-engine', () => ({
  AIRecommendationEngine: vi.fn(() => mockAIEngine)
}))

describe('PersonalizedRecommendationService', () => {
  let service: PersonalizedRecommendationService
  let mockWines: Wine[]
  let mockTasteProfile: TasteProfile
  let mockContext: RecommendationContext

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PersonalizedRecommendationService()

    // Mock data
    mockWines = [
      {
        id: 'wine-1',
        userId: 'user-1',
        name: 'Château Margaux',
        producer: 'Château Margaux',
        vintage: 2015,
        region: 'Margaux',
        country: 'France',
        varietal: ['Cabernet Sauvignon', 'Merlot'],
        type: 'red',
        quantity: 2,
        drinkingWindow: {
          earliestDate: new Date('2020-01-01'),
          peakStartDate: new Date('2023-01-01'),
          peakEndDate: new Date('2030-01-01'),
          latestDate: new Date('2035-01-01'),
          currentStatus: 'peak'
        },
        personalRating: 9,
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'wine-2',
        userId: 'user-1',
        name: 'Opus One',
        producer: 'Opus One Winery',
        vintage: 2018,
        region: 'Napa Valley',
        country: 'USA',
        varietal: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'],
        type: 'red',
        quantity: 1,
        drinkingWindow: {
          earliestDate: new Date('2022-01-01'),
          peakStartDate: new Date('2025-01-01'),
          peakEndDate: new Date('2035-01-01'),
          latestDate: new Date('2040-01-01'),
          currentStatus: 'ready'
        },
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    mockTasteProfile = {
      userId: 'user-1',
      redWinePreferences: {
        fruitiness: 7,
        earthiness: 6,
        oakiness: 5,
        acidity: 6,
        tannins: 7,
        sweetness: 2,
        body: 'full',
        preferredRegions: ['Bordeaux', 'Napa Valley'],
        preferredVarietals: ['Cabernet Sauvignon', 'Merlot'],
        dislikedCharacteristics: ['overly sweet']
      },
      whiteWinePreferences: {
        fruitiness: 6,
        earthiness: 4,
        oakiness: 4,
        acidity: 7,
        tannins: 2,
        sweetness: 3,
        body: 'medium',
        preferredRegions: ['Burgundy', 'Loire Valley'],
        preferredVarietals: ['Chardonnay', 'Sauvignon Blanc'],
        dislikedCharacteristics: ['too oaky']
      },
      sparklingPreferences: {
        fruitiness: 6,
        earthiness: 3,
        oakiness: 2,
        acidity: 8,
        tannins: 1,
        sweetness: 4,
        body: 'light',
        preferredRegions: ['Champagne'],
        preferredVarietals: ['Chardonnay', 'Pinot Noir'],
        dislikedCharacteristics: []
      },
      generalPreferences: {
        priceRange: {
          min: 50,
          max: 300,
          currency: 'USD'
        },
        occasionPreferences: ['dinner', 'celebration'],
        foodPairingImportance: 8
      },
      learningHistory: [],
      confidenceScore: 0.75,
      lastUpdated: new Date()
    }

    mockContext = {
      occasion: 'dinner',
      foodPairing: 'steak',
      timeOfDay: 'evening'
    }
  })

  describe('generateRecommendations', () => {
    it('should generate tonight recommendations successfully', async () => {
      // Mock database responses
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })),
            single: vi.fn().mockResolvedValue({ data: mockTasteProfile, error: null })
          }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockFromChain)

      // Mock AI response
      mockAIEngine.generateRecommendations.mockResolvedValue({
        recommendations: [
          {
            type: 'inventory',
            wineId: 'wine-1',
            reasoning: 'Perfect for steak dinner',
            confidence: 0.9
          }
        ],
        reasoning: 'Based on your preferences and the occasion',
        confidence: 0.9,
        educationalNotes: 'This wine pairs excellently with red meat',
        followUpQuestions: ['What temperature would you like serving suggestions?']
      })

      const request: PersonalizedRecommendationRequest = {
        userId: 'user-1',
        type: 'tonight',
        context: mockContext,
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateRecommendations(request)

      expect(result).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations[0].type).toBe('inventory')
      expect(result.confidence).toBeGreaterThan(0)
      expect(mockAIEngine.generateRecommendations).toHaveBeenCalled()
    })

    it('should generate purchase recommendations successfully', async () => {
      // Mock database responses
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })),
            single: vi.fn().mockResolvedValue({ data: mockTasteProfile, error: null })
          }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockFromChain)

      // Mock AI response for purchase recommendations
      mockAIEngine.generateRecommendations.mockResolvedValue({
        recommendations: [
          {
            type: 'purchase',
            suggestedWine: {
              name: 'Barolo Brunate',
              producer: 'Giuseppe Rinaldi',
              region: 'Piedmont',
              varietal: ['Nebbiolo'],
              type: 'red',
              estimatedPrice: { min: 80, max: 120, currency: 'USD' }
            },
            reasoning: 'Expands your Italian wine experience',
            confidence: 0.85
          }
        ],
        reasoning: 'Based on gaps in your collection',
        confidence: 0.85
      })

      const request: PersonalizedRecommendationRequest = {
        userId: 'user-1',
        type: 'purchase',
        context: { priceRange: { min: 50, max: 150, currency: 'USD' } },
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateRecommendations(request)

      expect(result).toBeDefined()
      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0].type).toBe('purchase')
      expect(result.recommendations[0].suggestedWine).toBeDefined()
      expect(result.recommendations[0].suggestedWine?.name).toBe('Barolo Brunate')
    })

    it('should handle empty inventory gracefully', async () => {
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })),
            single: vi.fn().mockResolvedValue({ data: mockTasteProfile, error: null })
          }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockFromChain)

      const request: PersonalizedRecommendationRequest = {
        userId: 'user-1',
        type: 'tonight',
        inventory: [],
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateRecommendations(request)

      expect(result).toBeDefined()
      expect(result.recommendations).toHaveLength(0)
      expect(result.reasoning).toContain('empty')
    })

    it('should require context for contextual recommendations', async () => {
      const request: PersonalizedRecommendationRequest = {
        userId: 'user-1',
        type: 'contextual',
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      await expect(service.generateRecommendations(request)).rejects.toThrow('Context is required')
    })
  })

  describe('urgency score calculation', () => {
    it('should calculate high urgency for peak wines', () => {
      const peakWine = mockWines[0] // Status: 'peak'
      const urgencyScore = (service as any).calculateUrgencyScore(peakWine)
      
      expect(urgencyScore).toBeGreaterThan(0.8)
    })

    it('should calculate medium urgency for ready wines', () => {
      const readyWine = mockWines[1] // Status: 'ready'
      const urgencyScore = (service as any).calculateUrgencyScore(readyWine)
      
      expect(urgencyScore).toBeGreaterThan(0.5)
      expect(urgencyScore).toBeLessThan(0.8)
    })

    it('should calculate low urgency for too young wines', () => {
      const youngWine = {
        ...mockWines[0],
        drinkingWindow: {
          ...mockWines[0].drinkingWindow,
          currentStatus: 'too_young' as const
        }
      }
      
      const urgencyScore = (service as any).calculateUrgencyScore(youngWine)
      
      expect(urgencyScore).toBeLessThan(0.3)
    })
  })

  describe('personalized score calculation', () => {
    it('should give higher scores for preferred regions', () => {
      const bordeauxWine = {
        ...mockWines[0],
        region: 'Bordeaux' // In preferred regions
      }
      
      const score = (service as any).calculatePersonalizedScore(
        bordeauxWine, 
        mockTasteProfile, 
        []
      )
      
      expect(score).toBeGreaterThan(0.5)
    })

    it('should give higher scores for preferred varietals', () => {
      const cabernetWine = {
        ...mockWines[0],
        varietal: ['Cabernet Sauvignon'] // In preferred varietals
      }
      
      const score = (service as any).calculatePersonalizedScore(
        cabernetWine, 
        mockTasteProfile, 
        []
      )
      
      expect(score).toBeGreaterThan(0.5)
    })
  })

  describe('taste profile gap analysis', () => {
    it('should identify missing regions', () => {
      const gapAnalysis = (service as any).analyzeTasteProfileGaps(
        mockTasteProfile,
        [],
        mockWines
      )
      
      expect(gapAnalysis.missingRegions).toContain('Tuscany')
      expect(gapAnalysis.missingRegions).toContain('Rioja')
    })

    it('should identify missing varietals', () => {
      const gapAnalysis = (service as any).analyzeTasteProfileGaps(
        mockTasteProfile,
        [],
        mockWines
      )
      
      expect(gapAnalysis.missingVarietals).toContain('Pinot Noir')
      expect(gapAnalysis.missingVarietals).toContain('Riesling')
    })

    it('should identify underrepresented wine types', () => {
      const gapAnalysis = (service as any).analyzeTasteProfileGaps(
        mockTasteProfile,
        [],
        mockWines // Only red wines
      )
      
      expect(gapAnalysis.underrepresentedTypes).toContain('white')
      expect(gapAnalysis.underrepresentedTypes).toContain('sparkling')
    })
  })

  describe('contextual filtering', () => {
    it('should filter wines by price range', () => {
      const contextWithPrice: RecommendationContext = {
        priceRange: { min: 100, max: 200, currency: 'USD' }
      }
      
      const winesWithPrices = mockWines.map(wine => ({
        ...wine,
        purchasePrice: wine.id === 'wine-1' ? 150 : 50
      }))
      
      const filtered = (service as any).filterWinesByContext(winesWithPrices, contextWithPrice)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('wine-1')
    })

    it('should filter wines by urgency', () => {
      const contextWithUrgency: RecommendationContext = {
        urgency: 'high'
      }
      
      const filtered = (service as any).filterWinesByContext(mockWines, contextWithUrgency)
      
      // Should only include peak and declining wines
      expect(filtered.every(wine => 
        wine.drinkingWindow.currentStatus === 'peak' || 
        wine.drinkingWindow.currentStatus === 'declining'
      )).toBe(true)
    })

    it('should filter wines by food pairing', () => {
      const contextWithFood: RecommendationContext = {
        foodPairing: 'fish'
      }
      
      const mixedWines = [
        ...mockWines,
        {
          ...mockWines[0],
          id: 'wine-3',
          type: 'white' as const
        }
      ]
      
      const filtered = (service as any).filterWinesByContext(mixedWines, contextWithFood)
      
      // Should prefer white wines for fish
      expect(filtered.some(wine => wine.type === 'white')).toBe(true)
    })
  })
})

describe('RecommendationFeedbackService', () => {
  let feedbackService: RecommendationFeedbackService

  beforeEach(() => {
    vi.clearAllMocks()
    feedbackService = new RecommendationFeedbackService()
  })

  describe('recordFeedback', () => {
    it('should record positive feedback successfully', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'recommendations') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: mockUpdate
              }))
            }))
          }
        }
        if (table === 'recommendation_feedback') {
          return { insert: mockInsert }
        }
        return { select: vi.fn() }
      })

      await feedbackService.recordFeedback(
        'rec-1',
        'user-1',
        'accepted',
        'Great recommendation!'
      )

      expect(mockUpdate).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle feedback recording errors', async () => {
      const mockUpdate = vi.fn().mockRejectedValue(new Error('Database error'))
      
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: mockUpdate
          }))
        }))
      })

      await expect(
        feedbackService.recordFeedback('rec-1', 'user-1', 'accepted')
      ).rejects.toThrow('Database error')
    })
  })

  describe('getRecommendationHistory', () => {
    it('should fetch recommendation history successfully', async () => {
      const mockHistory = [
        {
          id: 'rec-1',
          userId: 'user-1',
          type: 'inventory',
          reasoning: 'Great for tonight',
          confidence: 0.9,
          createdAt: new Date(),
          userFeedback: 'accepted'
        }
      ]

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null })
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await feedbackService.getRecommendationHistory('user-1', 10)

      expect(result).toEqual(mockHistory)
      expect(mockSelect).toHaveBeenCalledWith('*')
    })

    it.skip('should filter by recommendation type', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      
      const mockSelect = vi.fn(() => mockQuery)

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await feedbackService.getRecommendationHistory('user-1', 10, 'purchase')

      expect(result).toEqual([])
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'purchase')
    })
  })

  describe('getRecommendationAnalytics', () => {
    it('should calculate analytics correctly', async () => {
      const mockRecommendations = [
        { id: '1', confidence: 0.8, user_feedback: 'accepted', type: 'inventory', created_at: '2024-01-01' },
        { id: '2', confidence: 0.9, user_feedback: 'rejected', type: 'purchase', created_at: '2024-01-02' },
        { id: '3', confidence: 0.7, user_feedback: 'modified', type: 'inventory', created_at: '2024-01-03' },
        { id: '4', confidence: 0.85, user_feedback: null, type: 'pairing', created_at: '2024-01-04' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: mockRecommendations, error: null })
        }))
      })

      const analytics = await feedbackService.getRecommendationAnalytics('user-1')

      expect(analytics).toBeDefined()
      expect(analytics!.totalRecommendations).toBe(4)
      expect(analytics!.acceptanceRate).toBe(1/3) // 1 accepted out of 3 with feedback
      expect(analytics!.rejectionRate).toBe(1/3) // 1 rejected out of 3 with feedback
      expect(analytics!.modificationRate).toBe(1/3) // 1 modified out of 3 with feedback
      expect(analytics!.pendingFeedback).toBe(1)
      expect(analytics!.averageConfidence).toBeCloseTo(0.8125) // (0.8 + 0.9 + 0.7 + 0.85) / 4
      expect(analytics!.typeBreakdown.inventory).toBe(2)
      expect(analytics!.typeBreakdown.purchase).toBe(1)
      expect(analytics!.typeBreakdown.pairing).toBe(1)
    })

    it('should handle empty recommendation history', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      })

      const analytics = await feedbackService.getRecommendationAnalytics('user-1')

      expect(analytics).toBeDefined()
      expect(analytics!.totalRecommendations).toBe(0)
      expect(analytics!.acceptanceRate).toBe(0)
      expect(analytics!.averageConfidence).toBe(0)
    })
  })
})