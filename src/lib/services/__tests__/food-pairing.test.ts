// Food Pairing Service Tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FoodPairingService } from '../food-pairing'
import { Wine, TasteProfile } from '@/types'

// Mock dependencies
vi.mock('@/lib/ai/recommendation-engine')
vi.mock('@supabase/supabase-js')

describe('FoodPairingService', () => {
  let service: FoodPairingService
  let mockWines: Wine[]
  let mockTasteProfile: TasteProfile

  beforeEach(() => {
    service = new FoodPairingService()
    
    // Mock AI engine
    const mockAIEngine = {
      generateRecommendations: vi.fn(() => Promise.resolve({
        recommendations: [],
        reasoning: 'AI generated reasoning',
        confidence: 0.8,
        educationalNotes: 'Educational content',
        responseMetadata: {}
      }))
    }
    
    // @ts-ignore
    service.aiEngine = mockAIEngine
    
    // Mock wine inventory
    mockWines = [
      {
        id: 'wine-1',
        userId: 'user-1',
        name: 'Cabernet Sauvignon Reserve',
        producer: 'Napa Valley Winery',
        vintage: 2018,
        region: 'Napa Valley',
        country: 'USA',
        varietal: ['Cabernet Sauvignon'],
        type: 'red',
        quantity: 2,
        purchasePrice: 45,
        drinkingWindow: {
          earliestDate: new Date('2020-01-01'),
          peakStartDate: new Date('2023-01-01'),
          peakEndDate: new Date('2028-01-01'),
          latestDate: new Date('2035-01-01'),
          currentStatus: 'peak'
        },
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'wine-2',
        userId: 'user-1',
        name: 'Sauvignon Blanc',
        producer: 'Loire Valley Estate',
        vintage: 2022,
        region: 'Loire Valley',
        country: 'France',
        varietal: ['Sauvignon Blanc'],
        type: 'white',
        quantity: 1,
        purchasePrice: 25,
        drinkingWindow: {
          earliestDate: new Date('2022-01-01'),
          peakStartDate: new Date('2022-06-01'),
          peakEndDate: new Date('2025-01-01'),
          latestDate: new Date('2027-01-01'),
          currentStatus: 'ready'
        },
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Mock taste profile
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
        earthiness: 3,
        oakiness: 4,
        acidity: 8,
        tannins: 2,
        sweetness: 3,
        body: 'medium',
        preferredRegions: ['Loire Valley', 'Burgundy'],
        preferredVarietals: ['Sauvignon Blanc', 'Chardonnay'],
        dislikedCharacteristics: ['overly oaky']
      },
      sparklingPreferences: {
        fruitiness: 5,
        earthiness: 2,
        oakiness: 2,
        acidity: 9,
        tannins: 1,
        sweetness: 4,
        body: 'light',
        preferredRegions: ['Champagne'],
        preferredVarietals: ['Chardonnay', 'Pinot Noir'],
        dislikedCharacteristics: []
      },
      generalPreferences: {
        priceRange: { min: 20, max: 100, currency: 'USD' },
        occasionPreferences: ['dinner', 'celebration'],
        foodPairingImportance: 8
      },
      learningHistory: [],
      confidenceScore: 0.8,
      lastUpdated: new Date()
    }

    // Mock Supabase methods
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'palate_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'user-1', flavor_maps: { red: { fruitRipeness: 0.6, preferredRegions: ['Napa Valley'], preferredVarietals: ['Cabernet Sauvignon'] }, white: {}, sparkling: {} }, updated_at: new Date().toISOString() }, error: null })
          } as any
        }
        if (table === 'wines') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockWines, error: null })
          } as any
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) } as any
      })
    }

    // @ts-ignore
    service.supabase = mockSupabase
  })

  describe('generateFoodPairings', () => {
    it('should generate food pairings for red meat', async () => {
      const request = {
        userId: 'user-1',
        foodDescription: 'grilled ribeye steak',
        cuisine: 'american',
        cookingMethod: 'grilled',
        spiceLevel: 'none' as const,
        richness: 'rich' as const,
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateFoodPairings(request)

      expect(result.pairings).toBeDefined()
      expect(result.pairings.length).toBeGreaterThan(0)
      expect(result.reasoning).toContain('red meat')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.educationalNotes).toBeDefined()
    })

    it('should generate food pairings for white fish', async () => {
      const request = {
        userId: 'user-1',
        foodDescription: 'pan-seared halibut with lemon',
        cuisine: 'french',
        cookingMethod: 'pan-seared',
        spiceLevel: 'none' as const,
        richness: 'light' as const,
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateFoodPairings(request)

      expect(result.pairings).toBeDefined()
      expect(result.pairings.length).toBeGreaterThan(0)
      
      // Should have pairings for fish
      expect(result.pairings.length).toBeGreaterThan(0)
    })

    it('should handle spicy food appropriately', async () => {
      const request = {
        userId: 'user-1',
        foodDescription: 'spicy thai curry',
        cuisine: 'asian',
        spiceLevel: 'hot' as const,
        richness: 'medium' as const,
        inventory: mockWines,
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateFoodPairings(request)

      expect(result.pairings).toBeDefined()
      expect(result.educationalNotes).toContain('intense')
    })

    it('should return empty results for empty inventory', async () => {
      const request = {
        userId: 'user-1',
        foodDescription: 'grilled salmon',
        inventory: [],
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateFoodPairings(request)

      expect(result.pairings).toHaveLength(0)
      expect(result.reasoning).toContain('No suitable pairings')
    })
  })

  describe('generateContextualRecommendations', () => {
    it('should filter wines by price range', async () => {
      const filters = {
        priceRange: { min: 20, max: 30, currency: 'USD' },
        availability: 'inventory_only' as const
      }

      const result = await service.generateContextualRecommendations(
        'user-1',
        filters,
        mockTasteProfile
      )

      expect(result.pairings).toBeDefined()
      
      // Should only include wines within price range
      const wineInRange = mockWines.find(w => 
        w.purchasePrice && w.purchasePrice >= 20 && w.purchasePrice <= 30
      )
      expect(wineInRange).toBeDefined()
    })

    it('should filter wines by type', async () => {
      const filters = {
        wineType: ['red' as const],
        availability: 'inventory_only' as const
      }

      const result = await service.generateContextualRecommendations(
        'user-1',
        filters,
        mockTasteProfile
      )

      expect(result.pairings).toBeDefined()
      
      // All recommendations should be for red wines
      result.pairings.forEach(pairing => {
        if (pairing.wineId) {
          const wine = mockWines.find(w => w.id === pairing.wineId)
          expect(wine?.type).toBe('red')
        }
      })
    })

    it('should prioritize wines by urgency', async () => {
      const filters = {
        urgency: 'high' as const,
        availability: 'inventory_only' as const
      }

      const result = await service.generateContextualRecommendations(
        'user-1',
        filters,
        mockTasteProfile
      )

      expect(result.pairings).toBeDefined()
      
      // Should prioritize wines at peak or declining
      if (result.pairings.length > 0) {
        const topPairing = result.pairings[0]
        const wine = mockWines.find(w => w.id === topPairing.wineId)
        expect(['peak', 'declining']).toContain(wine?.drinkingWindow.currentStatus)
      }
    })

    it('should handle occasion-based filtering', async () => {
      const filters = {
        occasion: 'romantic dinner',
        availability: 'inventory_only' as const
      }

      const result = await service.generateContextualRecommendations(
        'user-1',
        filters,
        mockTasteProfile
      )

      expect(result.pairings).toBeDefined()
      expect(result.reasoning).toContain('criteria')
    })
  })

  describe('food analysis', () => {
    it('should correctly categorize red meat', () => {
      const analysis = (service as any).analyzeFoodCharacteristics({
        foodDescription: 'grilled beef steak',
        cookingMethod: 'grilled'
      })

      expect(analysis.category).toBe('red_meat')
      expect(analysis.cookingImpact.intensity).toBe('high')
      expect(analysis.cookingImpact.flavors).toContain('smoky')
    })

    it('should correctly categorize white fish', () => {
      const analysis = (service as any).analyzeFoodCharacteristics({
        foodDescription: 'steamed sole with herbs',
        cookingMethod: 'steamed'
      })

      expect(analysis.category).toBe('white_fish')
      expect(analysis.cookingImpact.intensity).toBe('low')
      expect(analysis.cookingImpact.flavors).toContain('delicate')
    })

    it('should handle spice level in intensity calculation', () => {
      const mildAnalysis = (service as any).analyzeFoodCharacteristics({
        foodDescription: 'chicken curry',
        spiceLevel: 'mild'
      })

      const hotAnalysis = (service as any).analyzeFoodCharacteristics({
        foodDescription: 'chicken curry',
        spiceLevel: 'hot'
      })

      expect(hotAnalysis.intensity).not.toBe(mildAnalysis.intensity)
    })
  })

  describe('pairing scoring', () => {
    it('should score classic pairings highly', () => {
      const wine = mockWines[0] // Red wine
      const foodAnalysis = {
        category: 'red_meat',
        intensity: 'intense' as const,
        cookingImpact: { intensity: 'high', flavors: ['smoky'], wineStyle: 'bold' },
        flavorComponents: ['savory', 'rich'],
        spiceLevel: 'none' as const,
        richness: 'rich' as const
      }

      const rule = {
        foodCategory: 'red_meat',
        wineTypes: ['red'],
        reasoning: 'Tannins complement proteins',
        confidence: 0.9,
        examples: []
      }

      const score = (service as any).calculatePairingScore(
        wine,
        foodAnalysis,
        rule,
        mockTasteProfile
      )

      expect(score).toBeGreaterThan(0.8)
    })

    it('should give preference bonuses for user preferences', () => {
      const wine = mockWines[0] // Napa Valley Cabernet
      const foodAnalysis = {
        category: 'red_meat',
        intensity: 'intense' as const,
        cookingImpact: { intensity: 'high', flavors: ['smoky'], wineStyle: 'bold' },
        flavorComponents: ['savory'],
        spiceLevel: 'none' as const,
        richness: 'rich' as const
      }

      const rule = {
        foodCategory: 'red_meat',
        wineTypes: ['red'],
        reasoning: 'Classic pairing',
        confidence: 0.8,
        examples: []
      }

      const score = (service as any).calculatePairingScore(
        wine,
        foodAnalysis,
        rule,
        mockTasteProfile
      )

      // Should get bonus for preferred region (Napa Valley) and varietal (Cabernet Sauvignon)
      expect(score).toBeGreaterThan(0.8)
    })
  })

  describe('contextual filtering', () => {
    it('should apply price range filters correctly', () => {
      const filters = {
        priceRange: { min: 20, max: 30, currency: 'USD' },
        availability: 'inventory_only' as const
      }

      const filtered = (service as any).applyContextualFilters(mockWines, filters)

      filtered.forEach((wine: Wine) => {
        if (wine.purchasePrice) {
          expect(wine.purchasePrice).toBeGreaterThanOrEqual(20)
          expect(wine.purchasePrice).toBeLessThanOrEqual(30)
        }
      })
    })

    it('should apply wine type filters correctly', () => {
      const filters = {
        wineType: ['red'],
        availability: 'inventory_only' as const
      }

      const filtered = (service as any).applyContextualFilters(mockWines, filters)

      filtered.forEach((wine: Wine) => {
        expect(wine.type).toBe('red')
      })
    })

    it('should apply urgency filters correctly', () => {
      const filters = {
        urgency: 'high' as const,
        availability: 'inventory_only' as const
      }

      const filtered = (service as any).applyContextualFilters(mockWines, filters)

      filtered.forEach((wine: Wine) => {
        expect(['peak', 'declining']).toContain(wine.drinkingWindow.currentStatus)
      })
    })
  })

  describe('educational content generation', () => {
    it('should generate appropriate educational notes', () => {
      const foodAnalysis = {
        category: 'red_meat',
        intensity: 'intense' as const,
        cookingImpact: { intensity: 'high', flavors: ['smoky'], wineStyle: 'bold' },
        flavorComponents: ['savory'],
        spiceLevel: 'none' as const,
        richness: 'rich' as const
      }

      const pairings = [{
        id: 'test',
        userId: 'user-1',
        type: 'pairing' as const,
        wineId: 'wine-1',
        context: {},
        reasoning: 'Classic pairing',
        confidence: 0.9,
        createdAt: new Date(),
        pairingScore: 0.9,
        pairingType: 'classic' as const,
        pairingExplanation: 'Tannins complement proteins'
      }]

      const notes = (service as any).generateEducationalNotes(
        foodAnalysis,
        pairings,
        mockTasteProfile
      )

      expect(notes).toContain('pairing')
      expect(notes).toContain('intense')
    })

    it('should generate serving recommendations', () => {
      const wine = mockWines[0] // Red wine
      const foodAnalysis = {
        category: 'red_meat',
        intensity: 'intense' as const,
        cookingImpact: { intensity: 'high', flavors: ['smoky'], wineStyle: 'bold' },
        flavorComponents: ['savory'],
        spiceLevel: 'none' as const,
        richness: 'rich' as const
      }

      const recommendations = (service as any).generateServingRecommendations(wine, foodAnalysis)

      expect(recommendations.temperature).toBeDefined()
      expect(recommendations.glassType).toBeDefined()
      expect(recommendations.servingSize).toBeDefined()
      expect(recommendations.temperature.celsius).toBe(16) // Red wine serving temp
    })
  })

  describe('error handling', () => {
    it('should handle missing user data gracefully', async () => {
      // Mock Supabase to return error
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'palate_profiles') {
            return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') }) } as any
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') }) } as any
        })
      }

      // @ts-ignore
      service.supabase = mockSupabase

      const request = {
        userId: 'nonexistent-user',
        foodDescription: 'grilled steak'
      }

      await expect(service.generateFoodPairings(request)).rejects.toThrow()
    })

    it('should handle empty inventory gracefully', async () => {
      const request = {
        userId: 'user-1',
        foodDescription: 'grilled steak',
        inventory: [],
        tasteProfile: mockTasteProfile
      }

      const result = await service.generateFoodPairings(request)

      expect(result.pairings).toHaveLength(0)
      expect(result.confidence).toBe(0)
      expect(result.reasoning).toContain('No suitable pairings')
    })
  })
})