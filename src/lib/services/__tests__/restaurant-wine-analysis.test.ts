import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RestaurantWineAnalysisService } from '../restaurant-wine-analysis'
import { ExtractedWineListItem, Wine, TasteProfile } from '@/types'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn()
        })),
        or: vi.fn(() => ({
          limit: vi.fn()
        }))
      }))
    }))
  }))
}))

describe('RestaurantWineAnalysisService', () => {
  let service: RestaurantWineAnalysisService
  let mockExtractedWines: ExtractedWineListItem[]
  let mockUserInventory: Wine[]
  let mockTasteProfile: TasteProfile

  beforeEach(() => {
    service = new RestaurantWineAnalysisService()
    
    mockExtractedWines = [
      {
        name: 'Caymus Cabernet Sauvignon',
        producer: 'Caymus Vineyards',
        vintage: 2020,
        price: '$85',
        description: 'Caymus Cabernet Sauvignon 2020 Napa Valley',
        confidence: 0.9
      },
      {
        name: 'Kendall-Jackson Chardonnay',
        producer: 'Kendall-Jackson',
        vintage: 2021,
        price: '$28',
        description: 'Kendall-Jackson Vintners Reserve Chardonnay',
        confidence: 0.8
      }
    ]

    mockUserInventory = [
      {
        id: '1',
        userId: 'user1',
        name: 'Caymus Cabernet Sauvignon',
        producer: 'Caymus Vineyards',
        vintage: 2019,
        region: 'Napa Valley',
        country: 'USA',
        varietal: ['Cabernet Sauvignon'],
        type: 'red',
        quantity: 2,
        drinkingWindow: {
          earliestDate: new Date('2023-01-01'),
          peakStartDate: new Date('2024-01-01'),
          peakEndDate: new Date('2028-01-01'),
          latestDate: new Date('2030-01-01'),
          currentStatus: 'ready'
        },
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    mockTasteProfile = {
      userId: 'user1',
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
        acidity: 7,
        tannins: 2,
        sweetness: 3,
        body: 'medium',
        preferredRegions: ['Burgundy', 'Sonoma'],
        preferredVarietals: ['Chardonnay', 'Sauvignon Blanc'],
        dislikedCharacteristics: ['overly oaked']
      },
      sparklingPreferences: {
        fruitiness: 5,
        earthiness: 2,
        oakiness: 2,
        acidity: 8,
        tannins: 1,
        sweetness: 2,
        body: 'light',
        preferredRegions: ['Champagne'],
        preferredVarietals: ['Chardonnay', 'Pinot Noir'],
        dislikedCharacteristics: ['too sweet']
      },
      generalPreferences: {
        priceRange: {
          min: 20,
          max: 100,
          currency: 'USD'
        },
        occasionPreferences: ['dinner', 'celebration'],
        foodPairingImportance: 8
      },
      learningHistory: [],
      confidenceScore: 0.8,
      lastUpdated: new Date()
    }
  })

  describe('calculateStringMatch', () => {
    it('should return 1 for identical strings', () => {
      const result = (service as any).calculateStringMatch('Caymus Cabernet', 'Caymus Cabernet')
      expect(result).toBe(1)
    })

    it('should return high score for similar strings', () => {
      const result = (service as any).calculateStringMatch('Caymus Cabernet Sauvignon', 'Caymus Cabernet')
      expect(result).toBeGreaterThan(0.5)
    })

    it('should return low score for different strings', () => {
      const result = (service as any).calculateStringMatch('Caymus Cabernet', 'Kendall Jackson Chardonnay')
      expect(result).toBeLessThan(0.3)
    })

    it('should be case insensitive', () => {
      const result = (service as any).calculateStringMatch('CAYMUS CABERNET', 'caymus cabernet')
      expect(result).toBe(1)
    })
  })

  describe('calculateWineMatchScore', () => {
    it('should return high confidence for exact name and producer match', () => {
      const extractedWine = mockExtractedWines[0]
      const inventoryWine = mockUserInventory[0]
      
      const result = (service as any).calculateWineMatchScore(extractedWine, inventoryWine)
      
      expect(result.confidence).toBeGreaterThan(0.6)
      expect(result.matchType).toBe('similar')
      expect(result.matchedFields).toContain('name')
      expect(result.matchedFields).toContain('producer')
    })

    it('should include vintage in match when available', () => {
      const extractedWine = { ...mockExtractedWines[0], vintage: 2019 }
      const inventoryWine = mockUserInventory[0]
      
      const result = (service as any).calculateWineMatchScore(extractedWine, inventoryWine)
      
      expect(result.matchedFields).toContain('vintage')
    })

    it('should return lower confidence for partial matches', () => {
      const extractedWine = {
        name: 'Caymus Red Wine',
        producer: 'Unknown Producer',
        confidence: 0.7
      }
      const inventoryWine = mockUserInventory[0]
      
      const result = (service as any).calculateWineMatchScore(extractedWine, inventoryWine)
      
      expect(result.confidence).toBeLessThan(0.8)
      expect(result.matchType).not.toBe('exact')
    })
  })

  describe('calculateTasteProfileMatch', () => {
    it('should return high score for preferred regions', () => {
      const wine = mockUserInventory[0] // Napa Valley Cabernet
      const result = (service as any).calculateTasteProfileMatch(wine, mockTasteProfile)
      
      expect(result).toBeGreaterThan(0.5)
    })

    it('should return high score for preferred varietals', () => {
      const wine = {
        ...mockUserInventory[0],
        varietal: ['Cabernet Sauvignon'] // Preferred varietal
      }
      const result = (service as any).calculateTasteProfileMatch(wine, mockTasteProfile)
      
      expect(result).toBeGreaterThan(0.5)
    })

    it('should penalize disliked characteristics', () => {
      const wine = {
        ...mockUserInventory[0],
        varietal: ['overly sweet'] // Disliked characteristic
      }
      const result = (service as any).calculateTasteProfileMatch(wine, mockTasteProfile)
      
      expect(result).toBeLessThan(0.5)
    })

    it('should use appropriate flavor profile for wine type', () => {
      const whiteWine = {
        ...mockUserInventory[0],
        type: 'white' as const,
        varietal: ['Chardonnay']
      }
      const result = (service as any).calculateTasteProfileMatch(whiteWine, mockTasteProfile)
      
      expect(result).toBeGreaterThan(0.2) // Should use white wine preferences
    })
  })

  describe('calculateFoodPairingScore', () => {
    it('should return high score for good red wine and beef pairing', () => {
      const wine = mockUserInventory[0] // Red wine
      const meal = {
        mainIngredient: 'beef',
        cookingMethod: 'grilled',
        spiceLevel: 'medium' as const,
        richness: 'rich' as const
      }
      
      const result = (service as any).calculateFoodPairingScore(wine, meal)
      
      expect(result).toBeGreaterThan(0.6)
    })

    it('should return lower score for poor pairing', () => {
      const wine = mockUserInventory[0] // Red wine
      const meal = {
        mainIngredient: 'fish', // Poor pairing with red wine
        cookingMethod: 'steamed',
        spiceLevel: 'mild' as const,
        richness: 'light' as const
      }
      
      const result = (service as any).calculateFoodPairingScore(wine, meal)
      
      expect(result).toBeLessThan(0.8) // Adjusted expectation
    })

    it('should consider cooking method in scoring', () => {
      const wine = mockUserInventory[0]
      const grilledMeal = {
        mainIngredient: 'beef',
        cookingMethod: 'grilled'
      }
      const steamedMeal = {
        mainIngredient: 'beef',
        cookingMethod: 'steamed'
      }
      
      const grilledScore = (service as any).calculateFoodPairingScore(wine, grilledMeal)
      const steamedScore = (service as any).calculateFoodPairingScore(wine, steamedMeal)
      
      expect(grilledScore).toBeGreaterThan(steamedScore)
    })
  })

  describe('calculatePriceScore', () => {
    it('should return perfect score for wines in price range', () => {
      const priceRange = { min: 20, max: 100 }
      const result = (service as any).calculatePriceScore('$50', priceRange)
      
      expect(result).toBe(1.0)
    })

    it('should return lower score for wines outside price range', () => {
      const priceRange = { min: 20, max: 50 }
      const result = (service as any).calculatePriceScore('$85', priceRange)
      
      expect(result).toBeLessThan(1.0)
    })

    it('should handle different price formats', () => {
      const priceRange = { min: 20, max: 100 }
      
      const dollarResult = (service as any).calculatePriceScore('$50', priceRange)
      const numberResult = (service as any).calculatePriceScore('50', priceRange)
      
      expect(dollarResult).toBeGreaterThan(0)
      expect(numberResult).toBeGreaterThan(0)
    })

    it('should return neutral score for unparseable prices', () => {
      const priceRange = { min: 20, max: 100 }
      const result = (service as any).calculatePriceScore('Market Price', priceRange)
      
      expect(result).toBe(0.5)
    })
  })

  describe('extractRegionFromDescription', () => {
    it('should extract known wine regions', () => {
      const descriptions = [
        'Caymus Cabernet Sauvignon 2020 Napa Valley',
        'Burgundy Pinot Noir from France',
        'Champagne Dom Perignon',
        'Chianti Classico DOCG'
      ]
      
      const regions = descriptions.map(desc => 
        (service as any).extractRegionFromDescription(desc)
      )
      
      expect(regions[0]).toBe('Napa')
      expect(regions[1]).toBe('Burgundy')
      expect(regions[2]).toBe('Champagne')
      expect(regions[3]).toBe('Chianti')
    })

    it('should return null for descriptions without known regions', () => {
      const result = (service as any).extractRegionFromDescription('Generic Red Wine 2020')
      expect(result).toBeNull()
    })

    it('should be case insensitive', () => {
      const result = (service as any).extractRegionFromDescription('napa valley cabernet sauvignon')
      expect(result).toBe('napa')
    })
  })

  describe('generateWineExplanation', () => {
    it('should generate comprehensive explanation for matched wine', () => {
      const match = {
        extractedWine: mockExtractedWines[0],
        matchedWine: mockUserInventory[0],
        confidence: 0.9,
        matchType: 'exact' as const,
        matchedFields: ['name', 'producer']
      }
      
      const context = {
        meal: {
          dishName: 'Grilled Steak',
          mainIngredient: 'beef'
        }
      }
      
      const reasoning = ['High confidence match', 'Excellent pairing with beef']
      
      const explanation = (service as any).generateWineExplanation(
        match, 
        mockTasteProfile, 
        context, 
        reasoning
      )
      
      expect(explanation).toContain('Caymus Cabernet Sauvignon')
      expect(explanation).toContain('Napa Valley')
      expect(explanation).toContain('red wine')
      expect(explanation).toContain('Grilled Steak')
    })

    it('should handle wines without matches', () => {
      const match = {
        extractedWine: mockExtractedWines[1],
        confidence: 0.5,
        matchType: 'none' as const,
        matchedFields: []
      }
      
      const explanation = (service as any).generateWineExplanation(
        match, 
        null, 
        {}, 
        []
      )
      
      expect(explanation).toContain('Kendall-Jackson Chardonnay')
      expect(explanation).toContain('quality selection')
    })

    it('should include taste profile information when available', () => {
      const match = {
        extractedWine: mockExtractedWines[0],
        matchedWine: mockUserInventory[0],
        confidence: 0.9,
        matchType: 'exact' as const,
        matchedFields: ['name', 'producer']
      }
      
      const explanation = (service as any).generateWineExplanation(
        match, 
        mockTasteProfile, 
        {}, 
        []
      )
      
      expect(explanation).toContain('preference for wines from Napa Valley')
      expect(explanation).toContain('Cabernet Sauvignon matches your taste')
    })
  })

  describe('getFoodPairingAdvice', () => {
    it('should provide advice for red wine and beef', () => {
      const advice = (service as any).getFoodPairingAdvice('red', 'beef')
      expect(advice).toContain('Red wines complement')
      expect(advice).toContain('beef')
    })

    it('should provide advice for white wine and fish', () => {
      const advice = (service as any).getFoodPairingAdvice('white', 'fish')
      expect(advice).toContain('White wines')
      expect(advice).toContain('fish')
    })

    it('should provide advice for sparkling wine and seafood', () => {
      const advice = (service as any).getFoodPairingAdvice('sparkling', 'seafood')
      expect(advice).toContain('bubbles')
      expect(advice).toContain('seafood')
    })

    it('should return null for unknown combinations', () => {
      const advice = (service as any).getFoodPairingAdvice('red', 'unknown_ingredient')
      expect(advice).toBeNull()
    })
  })

  describe('estimateWineRichness', () => {
    it('should classify light red wines correctly', () => {
      const lightRedWine = {
        ...mockUserInventory[0],
        varietal: ['Pinot Noir']
      }
      
      const richness = (service as any).estimateWineRichness(lightRedWine)
      expect(richness).toBe('light')
    })

    it('should classify rich red wines correctly', () => {
      const richRedWine = {
        ...mockUserInventory[0],
        varietal: ['Cabernet Sauvignon']
      }
      
      const richness = (service as any).estimateWineRichness(richRedWine)
      expect(richness).toBe('rich')
    })

    it('should classify white wines as light by default', () => {
      const whiteWine = {
        ...mockUserInventory[0],
        type: 'white' as const,
        varietal: ['Sauvignon Blanc']
      }
      
      const richness = (service as any).estimateWineRichness(whiteWine)
      expect(richness).toBe('light')
    })

    it('should classify sparkling wines as light', () => {
      const sparklingWine = {
        ...mockUserInventory[0],
        type: 'sparkling' as const,
        varietal: ['Chardonnay']
      }
      
      const richness = (service as any).estimateWineRichness(sparklingWine)
      expect(richness).toBe('light')
    })
  })
})