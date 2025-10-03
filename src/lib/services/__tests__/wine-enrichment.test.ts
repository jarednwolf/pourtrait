/**
 * Tests for Wine Data Enrichment Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { WineEnrichmentService, EnrichmentOptions } from '../wine-enrichment'
import { WineService } from '../wine-service'
import { ExternalWineDataService } from '../external-wine-data'
import { Wine, WineInput } from '@/types'

// Mock dependencies
vi.mock('../wine-service')
vi.mock('../external-wine-data', () => ({
  ExternalWineDataService: {
    enrichWineData: vi.fn(),
    validateWineData: vi.fn(),
    getDataFreshness: vi.fn()
  }
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
          }))
        }))
      }))
    }))
  }
}))

const mockWine: Wine = {
  id: 'test-wine-id',
  userId: 'test-user-id',
  name: 'Test Wine',
  producer: 'Test Producer',
  vintage: 2020,
  region: 'Test Region',
  country: 'Test Country',
  varietal: ['Cabernet Sauvignon'],
  type: 'red',
  quantity: 1,
  drinkingWindow: {
    earliestDate: new Date('2023-01-01'),
    peakStartDate: new Date('2025-01-01'),
    peakEndDate: new Date('2030-01-01'),
    latestDate: new Date('2035-01-01'),
    currentStatus: 'ready'
  },
  external_data: {},
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockEnrichmentResult = {
  success: true,
  enrichedData: {
    wineDbId: 'external_123',
    professionalRatings: [
      {
        source: 'Wine Spectator',
        score: 92,
        maxScore: 100,
        reviewer: 'Test Reviewer',
        reviewDate: new Date('2023-01-15')
      }
    ],
    tastingNotes: 'Rich and complex with notes of dark fruit.',
    alcoholContent: 14.5,
    lastUpdated: new Date()
  },
  sources: ['Wine Spectator', 'Vivino'],
  confidence: 0.85,
  errors: undefined
}

describe('WineEnrichmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('enrichWine', () => {
    it('should successfully enrich an existing wine', async () => {
      // Mock WineService.getWineById
      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      
      // Mock ExternalWineDataService.enrichWineData
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const result = await WineEnrichmentService.enrichWine('test-wine-id')

      expect(result.success).toBe(true)
      expect(result.wine).toBeDefined()
      expect(result.enrichmentData).toBeDefined()
      expect(result.confidence).toBe(0.85)
      expect(result.sources).toEqual(['Wine Spectator', 'Vivino'])
    })

    it('should return error when wine is not found', async () => {
      vi.mocked(WineService.getWineById).mockResolvedValue(null)

      const result = await WineEnrichmentService.enrichWine('nonexistent-wine-id')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Wine not found')
    })

    it('should skip enrichment if recently enriched and not forced', async () => {
      const recentlyEnrichedWine = {
        ...mockWine,
        external_data: {
          ...mockWine.external_data,
          lastUpdated: new Date() // Very recent
        }
      }

      vi.mocked(WineService.getWineById).mockResolvedValue(recentlyEnrichedWine)

      const result = await WineEnrichmentService.enrichWine('test-wine-id')

      expect(result.success).toBe(true)
      expect(result.cached).toBe(true)
      expect(ExternalWineDataService.enrichWineData).not.toHaveBeenCalled()
    })

    it('should force enrichment when forceRefresh is true', async () => {
      const recentlyEnrichedWine = {
        ...mockWine,
        external_data: {
          ...mockWine.external_data,
          lastUpdated: new Date()
        }
      }

      vi.mocked(WineService.getWineById).mockResolvedValue(recentlyEnrichedWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const options: EnrichmentOptions = { forceRefresh: true }
      const result = await WineEnrichmentService.enrichWine('test-wine-id', options)

      expect(result.success).toBe(true)
      expect(result.cached).toBeUndefined()
      expect(ExternalWineDataService.enrichWineData).toHaveBeenCalled()
    })

    it('should not apply enrichment if confidence is too low', async () => {
      const lowConfidenceResult = {
        ...mockEnrichmentResult,
        confidence: 0.3 // Below threshold
      }

      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(lowConfidenceResult)

      const result = await WineEnrichmentService.enrichWine('test-wine-id')

      expect(result.success).toBe(true)
      expect(result.confidence).toBe(0.3)
      expect(result.errors).toContain('Confidence too low to apply enrichment')
    })

    it('should handle enrichment service errors gracefully', async () => {
      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue({
        success: false,
        enrichedData: {},
        sources: [],
        confidence: 0,
        errors: ['API error']
      })

      const result = await WineEnrichmentService.enrichWine('test-wine-id')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('API error')
    })
  })

  describe('enrichWineOnAdd', () => {
    const mockWineInput: WineInput = {
      name: 'New Wine',
      producer: 'New Producer',
      vintage: 2021,
      region: 'New Region',
      country: 'New Country',
      varietal: ['Merlot'],
      type: 'red',
      quantity: 2
    }

    it('should enrich wine data during add process', async () => {
      vi.mocked(WineService.addWine).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const result = await WineEnrichmentService.enrichWineOnAdd('test-user-id', mockWineInput)

      expect(result.success).toBe(true)
      expect(result.wine).toBeDefined()
      expect(result.enrichmentData).toBeDefined()
      expect(WineService.addWine).toHaveBeenCalledWith('test-user-id', mockWineInput)
    })

    it('should add wine even if enrichment fails', async () => {
      vi.mocked(WineService.addWine).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue({
        success: false,
        enrichedData: {},
        sources: [],
        confidence: 0,
        errors: ['Enrichment failed']
      })

      const result = await WineEnrichmentService.enrichWineOnAdd('test-user-id', mockWineInput)

      expect(result.success).toBe(true)
      expect(result.wine).toBeDefined()
      expect(result.errors).toContain('Enrichment failed')
      expect(WineService.addWine).toHaveBeenCalled()
    })

    it('should handle wine service errors', async () => {
      vi.mocked(WineService.addWine).mockRejectedValue(new Error('Database error'))

      const result = await WineEnrichmentService.enrichWineOnAdd('test-user-id', mockWineInput)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database error')
    })
  })

  describe('bulkEnrichWines', () => {
    it('should process multiple wines in batches', async () => {
      const wineIds = ['wine1', 'wine2', 'wine3', 'wine4', 'wine5', 'wine6']
      
      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const result = await WineEnrichmentService.bulkEnrichWines(wineIds)

      expect(result.processed).toBe(6)
      expect(result.successful).toBe(6)
      expect(result.failed).toBe(0)
      expect(result.results).toHaveLength(6)
    })

    it('should handle mixed success and failure results', async () => {
      const wineIds = ['wine1', 'wine2', 'wine3']
      
      vi.mocked(WineService.getWineById)
        .mockResolvedValueOnce(mockWine)
        .mockResolvedValueOnce(null) // Wine not found
        .mockResolvedValueOnce(mockWine)

      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const result = await WineEnrichmentService.bulkEnrichWines(wineIds)

      expect(result.processed).toBe(3)
      expect(result.successful).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should respect batch processing to avoid overwhelming APIs', async () => {
      const wineIds = Array(12).fill(null).map((_, i) => `wine${i}`)
      
      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockResolvedValue(mockEnrichmentResult)

      const startTime = Date.now()
      const result = await WineEnrichmentService.bulkEnrichWines(wineIds)
      const endTime = Date.now()

      expect(result.processed).toBe(12)
      expect(result.successful).toBe(12)
      
      // Should take some time due to batch delays
      expect(endTime - startTime).toBeGreaterThan(1000) // At least 1 second for delays
    })
  })

  describe('getEnrichmentSuggestions', () => {
    it('should identify missing data and provide suggestions', async () => {
      const wineWithMinimalData = {
        ...mockWine,
        external_data: {} // No external data
      }

      vi.mocked(WineService.getWineById).mockResolvedValue(wineWithMinimalData)
      vi.mocked(ExternalWineDataService.getDataFreshness).mockReturnValue(0)

      const result = await WineEnrichmentService.getEnrichmentSuggestions('test-wine-id')

      expect(result.missingData).toContain('Professional ratings')
      expect(result.missingData).toContain('Tasting notes')
      expect(result.missingData).toContain('Alcohol content')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('should show high confidence for complete data', async () => {
      const completeWine = {
        ...mockWine,
        external_data: {
          professionalRatings: [mockEnrichmentResult.enrichedData.professionalRatings![0]],
          tastingNotes: 'Complete tasting notes',
          alcoholContent: 14.5,
          servingTemperature: { min: 16, max: 18 },
          agingPotential: 15,
          lastUpdated: new Date()
        }
      }

      vi.mocked(WineService.getWineById).mockResolvedValue(completeWine)
      vi.mocked(ExternalWineDataService.getDataFreshness).mockReturnValue(1.0)

      const result = await WineEnrichmentService.getEnrichmentSuggestions('test-wine-id')

      expect(result.missingData).toHaveLength(0)
      expect(result.suggestions).toHaveLength(0)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should handle wine not found', async () => {
      vi.mocked(WineService.getWineById).mockResolvedValue(null)

      const result = await WineEnrichmentService.getEnrichmentSuggestions('nonexistent-wine-id')

      expect(result.suggestions).toHaveLength(0)
      expect(result.missingData).toContain('Wine not found')
      expect(result.confidence).toBe(0)
    })
  })

  describe('getEnrichmentStats', () => {
    it('should calculate enrichment statistics for user collection', async () => {
      const mockWines = [
        {
          ...mockWine,
          id: 'wine1',
          external_data: {
            professionalRatings: [mockEnrichmentResult.enrichedData.professionalRatings![0]],
            lastUpdated: new Date()
          }
        },
        {
          ...mockWine,
          id: 'wine2',
          external_data: {} // Not enriched
        },
        {
          ...mockWine,
          id: 'wine3',
          external_data: {
            professionalRatings: [mockEnrichmentResult.enrichedData.professionalRatings![0]],
            lastUpdated: new Date('2023-01-01')
          }
        }
      ]

      vi.mocked(WineService.getInventory).mockResolvedValue(mockWines)
      vi.mocked(ExternalWineDataService.validateWineData).mockReturnValue({
        isValid: true,
        issues: [],
        score: 0.8
      })

      const stats = await WineEnrichmentService.getEnrichmentStats('test-user-id')

      expect(stats.totalWines).toBe(3)
      expect(stats.enrichedWines).toBe(2)
      expect(stats.enrichmentRate).toBeCloseTo(0.67, 2)
      expect(stats.averageConfidence).toBeGreaterThan(0)
      expect(stats.lastEnrichment).toBeDefined()
    })

    it('should handle empty collection', async () => {
      vi.mocked(WineService.getInventory).mockResolvedValue([])

      const stats = await WineEnrichmentService.getEnrichmentStats('test-user-id')

      expect(stats.totalWines).toBe(0)
      expect(stats.enrichedWines).toBe(0)
      expect(stats.enrichmentRate).toBe(0)
      expect(stats.averageConfidence).toBe(0)
      expect(stats.lastEnrichment).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(WineService.getWineById).mockRejectedValue(new Error('Database connection failed'))

      const result = await WineEnrichmentService.enrichWine('test-wine-id')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database connection failed')
    })

    it('should handle external service timeouts', async () => {
      vi.mocked(WineService.getWineById).mockResolvedValue(mockWine)
      vi.mocked(ExternalWineDataService.enrichWineData).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const options: EnrichmentOptions = { timeout: 50 }
      const result = await WineEnrichmentService.enrichWine('test-wine-id', options)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
})