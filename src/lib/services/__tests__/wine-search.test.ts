import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { WineSearchService } from '../wine-search'
import { supabase } from '@/lib/supabase'
import type { SearchFilters, Wine } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            in: vi.fn(() => ({
              overlaps: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as any

describe('WineSearchService', () => {
  const userId = 'test-user-id'
  
  const mockWines: Wine[] = [
    {
      id: '1',
      userId,
      name: 'Château Margaux 2010',
      producer: 'Château Margaux',
      vintage: 2010,
      region: 'Bordeaux',
      country: 'France',
      varietal: ['Cabernet Sauvignon', 'Merlot'],
      type: 'red',
      quantity: 2,
      purchasePrice: 500,
      purchaseDate: new Date('2020-01-01'),
      drinkingWindow: {
        earliestDate: new Date('2020-01-01'),
        peakStartDate: new Date('2025-01-01'),
        peakEndDate: new Date('2035-01-01'),
        latestDate: new Date('2040-01-01'),
        currentStatus: 'ready'
      },
      personalRating: 9,
      personalNotes: 'Exceptional vintage',
      imageUrl: null,
      externalData: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      userId,
      name: 'Dom Pérignon 2012',
      producer: 'Dom Pérignon',
      vintage: 2012,
      region: 'Champagne',
      country: 'France',
      varietal: ['Chardonnay', 'Pinot Noir'],
      type: 'sparkling',
      quantity: 1,
      purchasePrice: 200,
      purchaseDate: new Date('2021-01-01'),
      drinkingWindow: {
        earliestDate: new Date('2021-01-01'),
        peakStartDate: new Date('2022-01-01'),
        peakEndDate: new Date('2030-01-01'),
        latestDate: new Date('2035-01-01'),
        currentStatus: 'peak'
      },
      personalRating: 8,
      personalNotes: 'Great for celebrations',
      imageUrl: null,
      externalData: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchWines', () => {
    it('should search wines with basic query', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({
                  data: mockWines,
                  error: null,
                  count: 2
                }))
              }))
            }))
          }))
        }))
      })

      const filters: SearchFilters = {
        query: 'Château',
        page: 1,
        limit: 20
      }

      const result = await WineSearchService.searchWines(userId, filters)

      expect(result).toEqual({
        items: mockWines.map(w => ({
          ...w,
          imageUrl: w.imageUrl ?? undefined,
        })),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasMore: false
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
    })

    it('should apply wine type filters', async () => {
      const mockIn = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [mockWines[0]], // Only red wine
            error: null,
            count: 1
          }))
        }))
      }))

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: mockIn
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: SearchFilters = {
        type: ['red'],
        page: 1,
        limit: 20
      }

      const result = await WineSearchService.searchWines(userId, filters)

      expect(result.items).toHaveLength(1)
      expect(mockIn).toHaveBeenCalledWith('type', ['red'])
    })

    it('should apply vintage range filters', async () => {
      const mockLte = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: mockWines,
            error: null,
            count: 2
          }))
        }))
      }))

      const mockGte = vi.fn(() => ({
        lte: mockLte
      }))

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: mockGte
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: SearchFilters = {
        vintage: { min: 2010, max: 2015 },
        page: 1,
        limit: 20
      }

      await WineSearchService.searchWines(userId, filters)

      expect(mockGte).toHaveBeenCalledWith('vintage', 2010)
      expect(mockLte).toHaveBeenCalledWith('vintage', 2015)
    })

    it('should apply price range filters', async () => {
      const mockLte = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: mockWines,
            error: null,
            count: 2
          }))
        }))
      }))

      const mockGte = vi.fn(() => ({
        lte: mockLte
      }))

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: mockGte
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: SearchFilters = {
        priceRange: { min: 100, max: 600 },
        page: 1,
        limit: 20
      }

      await WineSearchService.searchWines(userId, filters)

      expect(mockGte).toHaveBeenCalledWith('purchase_price', 100)
      expect(mockLte).toHaveBeenCalledWith('purchase_price', 600)
    })

    it('should handle pagination correctly', async () => {
      const mockRange = vi.fn(() => Promise.resolve({
        data: mockWines,
        error: null,
        count: 50
      }))

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: mockRange
            }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const filters: SearchFilters = {
        page: 2,
        limit: 10
      }

      const result = await WineSearchService.searchWines(userId, filters)

      expect(result.totalPages).toBe(5)
      expect(result.hasMore).toBe(true)
      expect(mockRange).toHaveBeenCalledWith(10, 19)
    })

    it('should handle search errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Database error' },
                count: null
              }))
            }))
          }))
        }))
      })

      await expect(WineSearchService.searchWines(userId, {}))
        .rejects.toThrow('Search failed: Database error')
    })
  })

  describe('getSearchSuggestions', () => {
    it('should return suggestions for wine names', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: mockWines,
                error: null
              }))
            }))
          }))
        }))
      })

      const suggestions = await WineSearchService.getSearchSuggestions(userId, 'Château', 5)

      expect(suggestions).toContainEqual({
        type: 'wine',
        value: 'Château Margaux 2010',
        label: 'Château Margaux 2010',
        count: 1
      })
    })

    it('should return empty array for short queries', async () => {
      const suggestions = await WineSearchService.getSearchSuggestions(userId, 'a', 5)
      expect(suggestions).toEqual([])
    })

    it('should limit suggestions to specified count', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: mockWines,
                error: null
              }))
            }))
          }))
        }))
      })

      const suggestions = await WineSearchService.getSearchSuggestions(userId, 'wine', 1)
      expect(suggestions.length).toBeLessThanOrEqual(1)
    })
  })

  describe('saveSearch', () => {
    it('should save a search successfully', async () => {
      const mockSavedSearch = {
        id: 'saved-search-id',
        user_id: userId,
        name: 'My Favorite Reds',
        filters: JSON.stringify({ type: ['red'] }),
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockSavedSearch,
              error: null
            }))
          }))
        }))
      })

      const filters: SearchFilters = { type: ['red'] }
      const result = await WineSearchService.saveSearch(userId, 'My Favorite Reds', filters)

      expect(result.name).toBe('My Favorite Reds')
      expect(result.filters).toEqual(filters)
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_searches')
    })

    it('should handle save errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Save failed' }
            }))
          }))
        }))
      })

      await expect(WineSearchService.saveSearch(userId, 'Test', {}))
        .rejects.toThrow('Failed to save search: Save failed')
    })
  })

  describe('getSavedSearches', () => {
    it('should retrieve saved searches', async () => {
      const mockSavedSearches = [
        {
          id: '1',
          user_id: userId,
          name: 'Red Wines',
          filters: JSON.stringify({ type: ['red'] }),
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockSavedSearches,
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await WineSearchService.getSavedSearches(userId)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Red Wines')
      expect(result[0].isDefault).toBe(true)
    })
  })

  describe('deleteSavedSearch', () => {
    it('should delete a saved search', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: null
          }))
        }))
      })

      await expect(WineSearchService.deleteSavedSearch('search-id'))
        .resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_searches')
    })
  })

  describe('recordSearchHistory', () => {
    it('should record search history without throwing', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({
          error: null
        }))
      })

      await expect(WineSearchService.recordSearchHistory(
        userId, 
        'test query', 
        { query: 'test' }, 
        5
      )).resolves.not.toThrow()
    })

    it('should not throw on history recording failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({
          error: { message: 'History failed' }
        }))
      })

      // Should not throw even if history recording fails
      await expect(WineSearchService.recordSearchHistory(
        userId, 
        'test query', 
        { query: 'test' }, 
        5
      )).resolves.not.toThrow()
    })
  })

  describe('relevance scoring', () => {
    it('should score exact matches highest', () => {
      const wines = [
        { ...mockWines[0], name: 'Margaux' },
        { ...mockWines[1], name: 'Dom Pérignon' }
      ]

      // Access private method through any cast for testing
      const service = WineSearchService as any
      const scored = service.scoreAndSortByRelevance(wines, 'margaux')

      expect(scored[0].name).toBe('Margaux')
    })

    it('should handle case insensitive matching', () => {
      const wines = [mockWines[0]]
      
      const service = WineSearchService as any
      const score = service.calculateRelevanceScore(wines[0], 'château')

      expect(score).toBeGreaterThan(0)
    })
  })

  describe('facet calculations', () => {
    it('should calculate type facets correctly', () => {
      const service = WineSearchService as any
      const facets = service.calculateFacetCounts(mockWines, 'type')

      expect(facets).toEqual([
        { value: 'red', count: 1, label: 'red' },
        { value: 'sparkling', count: 1, label: 'sparkling' }
      ])
    })

    it('should calculate varietal facets correctly', () => {
      const service = WineSearchService as any
      const facets = service.calculateVarietalFacets(mockWines)

      expect(facets).toContainEqual({ value: 'Cabernet Sauvignon', count: 1, label: 'Cabernet Sauvignon' })
      expect(facets).toContainEqual({ value: 'Chardonnay', count: 1, label: 'Chardonnay' })
    })

    it('should calculate price range facets correctly', () => {
      // Create wines with the correct database field names
      const testWines = mockWines.map(wine => ({
        ...wine,
        purchase_price: wine.purchasePrice // Map to database field name
      })) as any[]

      const service = WineSearchService as any
      const facets = service.calculatePriceRangeFacets(testWines)

      // Check that we have facets for the price ranges that contain our wines
      // Wine 1: $500 (Over $200), Wine 2: $200 ($100 - $200)
      expect(facets.some(f => f.label === '$100 - $200')).toBe(true)
      expect(facets.some(f => f.label === 'Over $200')).toBe(true)
      expect(facets.length).toBeGreaterThan(0)
    })
  })
})