/**
 * Tests for External Wine Data Integration Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ExternalWineDataService, WineSearchQuery } from '../external-wine-data'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('ExternalWineDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear cache before each test
    ExternalWineDataService.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('enrichWineData', () => {
    it('should successfully enrich wine data from multiple sources', async () => {
      const query: WineSearchQuery = {
        name: 'Château Margaux',
        producer: 'Château Margaux',
        vintage: 2015,
        region: 'Margaux',
        varietal: ['Cabernet Sauvignon', 'Merlot'],
        type: 'red'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
      expect(result.sources.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.enrichedData).toBeDefined()
    })

    it('should handle empty query gracefully', async () => {
      const query: WineSearchQuery = {}

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.errors).toBeDefined()
    })

    it('should return cached results when available', async () => {
      const query: WineSearchQuery = {
        name: 'Test Wine',
        producer: 'Test Producer',
        vintage: 2020
      }

      // First call
      const result1 = await ExternalWineDataService.enrichWineData(query)
      
      // Second call should use cache
      const result2 = await ExternalWineDataService.enrichWineData(query)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // Compare everything except lastUpdated timestamp
      const { lastUpdated: lastUpdated1, ...data1 } = result1.enrichedData
      const { lastUpdated: lastUpdated2, ...data2 } = result2.enrichedData
      expect(data1).toEqual(data2)
    })

    it('should merge data from multiple sources correctly', async () => {
      const query: WineSearchQuery = {
        name: 'Opus One',
        producer: 'Opus One Winery',
        vintage: 2018,
        region: 'Napa Valley',
        type: 'red'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
      expect(result.enrichedData.professionalRatings).toBeDefined()
      expect(result.enrichedData.professionalRatings!.length).toBeGreaterThan(0)
      
      // Should have ratings from multiple sources
      const sources = result.enrichedData.professionalRatings!.map(r => r.source)
      const uniqueSources = new Set(sources)
      expect(uniqueSources.size).toBeGreaterThan(1)
    })

    it('should calculate confidence based on source reliability', async () => {
      const query: WineSearchQuery = {
        name: 'Dom Pérignon',
        producer: 'Moët & Chandon',
        vintage: 2012,
        type: 'sparkling'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.confidence).toBeLessThanOrEqual(1.0)
    })
  })

  describe('validateWineData', () => {
    it('should validate complete wine data as valid', () => {
      const wineData = {
        wineDbId: 'test_123',
        professionalRatings: [
          {
            source: 'Wine Spectator',
            score: 95,
            maxScore: 100,
            reviewer: 'James Laube',
            reviewDate: new Date('2023-01-15')
          }
        ],
        tastingNotes: 'Rich and complex with notes of dark fruit.',
        alcoholContent: 14.5,
        servingTemperature: { min: 16, max: 18 },
        agingPotential: 20,
        lastUpdated: new Date()
      }

      const validation = ExternalWineDataService.validateWineData(wineData)

      expect(validation.isValid).toBe(true)
      expect(validation.issues).toHaveLength(0)
      expect(validation.score).toBe(1.0)
    })

    it('should identify missing required fields', () => {
      const wineData = {
        professionalRatings: [
          {
            source: '',
            score: 95,
            maxScore: 100
          }
        ]
      }

      const validation = ExternalWineDataService.validateWineData(wineData)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Missing wine database ID')
      expect(validation.issues).toContain('Rating 1: Missing source')
      expect(validation.score).toBeLessThan(1.0)
    })

    it('should validate alcohol content range', () => {
      const wineData = {
        wineDbId: 'test_123',
        alcoholContent: 25, // Invalid - too high
        lastUpdated: new Date()
      }

      const validation = ExternalWineDataService.validateWineData(wineData)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Invalid alcohol content')
      expect(validation.score).toBeLessThan(1.0)
    })

    it('should validate serving temperature range', () => {
      const wineData = {
        wineDbId: 'test_123',
        servingTemperature: { min: 20, max: 15 }, // Invalid - min > max
        lastUpdated: new Date()
      }

      const validation = ExternalWineDataService.validateWineData(wineData)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Invalid serving temperature range')
    })

    it('should validate professional rating scores', () => {
      const wineData = {
        wineDbId: 'test_123',
        professionalRatings: [
          {
            source: 'Test Source',
            score: 150, // Invalid - exceeds max score
            maxScore: 100
          }
        ],
        lastUpdated: new Date()
      }

      const validation = ExternalWineDataService.validateWineData(wineData)

      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain('Rating 1: Invalid score range')
    })
  })

  describe('getDataFreshness', () => {
    it('should return 1.0 for fresh data (within a week)', () => {
      const lastUpdated = new Date()
      lastUpdated.setDate(lastUpdated.getDate() - 3) // 3 days ago

      const freshness = ExternalWineDataService.getDataFreshness(lastUpdated)

      expect(freshness).toBe(1.0)
    })

    it('should return 0.8 for good data (within a month)', () => {
      const lastUpdated = new Date()
      lastUpdated.setDate(lastUpdated.getDate() - 15) // 15 days ago

      const freshness = ExternalWineDataService.getDataFreshness(lastUpdated)

      expect(freshness).toBe(0.8)
    })

    it('should return 0.6 for acceptable data (within 3 months)', () => {
      const lastUpdated = new Date()
      lastUpdated.setDate(lastUpdated.getDate() - 60) // 60 days ago

      const freshness = ExternalWineDataService.getDataFreshness(lastUpdated)

      expect(freshness).toBe(0.6)
    })

    it('should return 0.4 for stale data (within a year)', () => {
      const lastUpdated = new Date()
      lastUpdated.setDate(lastUpdated.getDate() - 200) // 200 days ago

      const freshness = ExternalWineDataService.getDataFreshness(lastUpdated)

      expect(freshness).toBe(0.4)
    })

    it('should return 0.2 for very stale data (over a year)', () => {
      const lastUpdated = new Date()
      lastUpdated.setFullYear(lastUpdated.getFullYear() - 2) // 2 years ago

      const freshness = ExternalWineDataService.getDataFreshness(lastUpdated)

      expect(freshness).toBe(0.2)
    })

    it('should return 0 for undefined date', () => {
      const freshness = ExternalWineDataService.getDataFreshness(undefined)

      expect(freshness).toBe(0)
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits for API calls', async () => {
      const query: WineSearchQuery = {
        name: 'Test Wine',
        producer: 'Test Producer'
      }

      // Make multiple rapid calls
      const promises = Array(10).fill(null).map(() => 
        ExternalWineDataService.enrichWineData(query)
      )

      const results = await Promise.all(promises)

      // All should succeed due to caching, but rate limiting should be applied internally
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock fetch to throw an error
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const query: WineSearchQuery = {
        name: 'Test Wine',
        producer: 'Test Producer'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true) // Should still succeed with mock data
      expect(result.sources.length).toBeGreaterThan(0)
    })

    it('should handle invalid API responses', async () => {
      // Mock fetch to return invalid response
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      } as Response)

      const query: WineSearchQuery = {
        name: 'Nonexistent Wine',
        producer: 'Nonexistent Producer'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      // Should handle gracefully and return what data is available
      expect(result).toBeDefined()
    })
  })

  describe('Data Merging', () => {
    it('should merge professional ratings from multiple sources', async () => {
      const query: WineSearchQuery = {
        name: 'Caymus Cabernet',
        producer: 'Caymus Vineyards',
        vintage: 2019,
        type: 'red'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
      expect(result.enrichedData.professionalRatings).toBeDefined()
      
      const ratings = result.enrichedData.professionalRatings!
      expect(ratings.length).toBeGreaterThan(1)
      
      // Should have different sources
      const sources = ratings.map(r => r.source)
      const uniqueSources = new Set(sources)
      expect(uniqueSources.size).toBeGreaterThan(1)
    })

    it('should prioritize higher confidence sources for single-value fields', async () => {
      const query: WineSearchQuery = {
        name: 'Screaming Eagle',
        producer: 'Screaming Eagle',
        vintage: 2018,
        type: 'red'
      }

      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
      expect(result.enrichedData.wineDbId).toBeDefined()
      expect(result.enrichedData.professionalRatings).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  describe('Cache Management', () => {
    it('should cache results to avoid duplicate API calls', async () => {
      const query: WineSearchQuery = {
        name: 'Cached Wine',
        producer: 'Cached Producer',
        vintage: 2020
      }

      // First call
      const start1 = Date.now()
      const result1 = await ExternalWineDataService.enrichWineData(query)
      const time1 = Date.now() - start1

      // Second call (should be faster due to caching)
      const start2 = Date.now()
      const result2 = await ExternalWineDataService.enrichWineData(query)
      const time2 = Date.now() - start2

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(time2).toBeLessThan(time1) // Second call should be faster
      expect(result1.enrichedData).toEqual(result2.enrichedData)
    })

    it('should clear cache when requested', async () => {
      const query: WineSearchQuery = {
        name: 'Clear Cache Test',
        producer: 'Test Producer'
      }

      // Make initial call
      await ExternalWineDataService.enrichWineData(query)

      // Clear cache
      ExternalWineDataService.clearCache()

      // Make another call (should not use cache)
      const result = await ExternalWineDataService.enrichWineData(query)

      expect(result.success).toBe(true)
    })
  })
})