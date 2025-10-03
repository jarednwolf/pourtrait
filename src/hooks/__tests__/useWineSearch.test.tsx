import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWineSearch } from '../useWineSearch'
import { WineSearchService } from '@/lib/services/wine-search'
import { useAuth } from '../useAuth'

// Mock dependencies
vi.mock('../useAuth')
vi.mock('@/lib/services/wine-search')

const mockUseAuth = useAuth as any
const mockWineSearchService = WineSearchService as any

describe('useWineSearch', () => {
  const mockUser = { id: 'test-user-id' }
  
  const mockSearchResult = {
    items: [
      {
        id: '1',
        name: 'Test Wine',
        producer: 'Test Producer',
        vintage: 2020,
        type: 'red'
      }
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false
  }

  const mockFacets = {
    types: [{ value: 'red', count: 1, label: 'Red' }],
    regions: [],
    countries: [],
    producers: [],
    varietals: [],
    vintages: [],
    drinkingWindowStatus: [],
    priceRanges: [],
    ratingRanges: []
  }

  const mockSuggestions = [
    {
      type: 'wine' as const,
      value: 'Test Wine',
      label: 'Test Wine',
      count: 1
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockWineSearchService.searchWines = vi.fn().mockResolvedValue(mockSearchResult)
    mockWineSearchService.getSearchFacets = vi.fn().mockResolvedValue(mockFacets)
    mockWineSearchService.getSearchSuggestions = vi.fn().mockResolvedValue(mockSuggestions)
    mockWineSearchService.getSavedSearches = vi.fn().mockResolvedValue([])
    mockWineSearchService.saveSearch = vi.fn().mockResolvedValue({
      id: 'saved-id',
      userId: mockUser.id,
      name: 'Test Search',
      filters: {},
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockWineSearchService.deleteSavedSearch = vi.fn().mockResolvedValue(undefined)
    mockWineSearchService.recordSearchHistory = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    expect(result.current.results).toBeNull()
    expect(result.current.facets).toBeNull()
    expect(result.current.suggestions).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.filters).toEqual({
      page: 1,
      limit: 20
    })
    expect(result.current.hasActiveFilters).toBe(false)
    expect(result.current.canLoadMore).toBe(false)
  })

  it('should perform search when called', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.search()
    })

    expect(mockWineSearchService.searchWines).toHaveBeenCalledWith(
      mockUser.id,
      { page: 1, limit: 20 }
    )
    expect(result.current.results).toEqual(mockSearchResult)
    expect(result.current.isLoading).toBe(false)
  })

  it('should update filters correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    act(() => {
      result.current.updateFilter('query', 'test wine')
    })

    expect(result.current.filters.query).toBe('test wine')
    expect(result.current.filters.page).toBe(1) // Should reset to page 1
  })

  it('should set filters correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    const newFilters = {
      query: 'bordeaux',
      type: ['red' as const],
      page: 1,
      limit: 20
    }

    act(() => {
      result.current.setFilters(newFilters)
    })

    expect(result.current.filters).toEqual(newFilters)
  })

  it('should clear filters correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    // Set some filters first
    act(() => {
      result.current.updateFilter('query', 'test')
      result.current.updateFilter('type', ['red'])
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toEqual({
      page: 1,
      limit: 20
    })
    expect(result.current.hasActiveFilters).toBe(false)
    expect(result.current.results).toBeNull()
  })

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    expect(result.current.hasActiveFilters).toBe(false)

    act(() => {
      result.current.updateFilter('query', 'test')
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.updateFilter('type', ['red'])
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('should load more results correctly', async () => {
    const mockResultsWithMore = {
      ...mockSearchResult,
      hasMore: true,
      totalPages: 2
    }

    const mockMoreResults = {
      items: [{ id: '2', name: 'Another Wine' }],
      total: 2,
      page: 2,
      limit: 20,
      totalPages: 2,
      hasMore: false
    }

    mockWineSearchService.searchWines
      .mockResolvedValueOnce(mockResultsWithMore)
      .mockResolvedValueOnce(mockMoreResults)

    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    // Initial search
    await act(async () => {
      await result.current.search()
    })

    expect(result.current.canLoadMore).toBe(true)

    // Load more
    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.results?.items).toHaveLength(2)
    expect(result.current.filters.page).toBe(2)
  })

  it('should get suggestions correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.getSuggestions('test')
    })

    expect(mockWineSearchService.getSearchSuggestions).toHaveBeenCalledWith(
      mockUser.id,
      'test',
      10
    )
    expect(result.current.suggestions).toEqual(mockSuggestions)
  })

  it('should not get suggestions for short queries', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.getSuggestions('a')
    })

    expect(mockWineSearchService.getSearchSuggestions).not.toHaveBeenCalled()
    expect(result.current.suggestions).toEqual([])
  })

  it('should clear suggestions correctly', () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    // Set suggestions first
    act(() => {
      result.current.getSuggestions('test')
    })

    act(() => {
      result.current.clearSuggestions()
    })

    expect(result.current.suggestions).toEqual([])
  })

  it('should save current search correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    // Set some filters
    act(() => {
      result.current.updateFilter('type', ['red'])
    })

    await act(async () => {
      await result.current.saveCurrentSearch('My Red Wines')
    })

    expect(mockWineSearchService.saveSearch).toHaveBeenCalledWith(
      mockUser.id,
      'My Red Wines',
      expect.objectContaining({ type: ['red'] }),
      false
    )
  })

  it('should load saved search correctly', () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    const savedSearch = {
      id: 'saved-id',
      userId: mockUser.id,
      name: 'Test Search',
      filters: { type: ['red' as const] },
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    act(() => {
      result.current.loadSavedSearch(savedSearch)
    })

    expect(result.current.filters.type).toEqual(['red'])
  })

  it('should delete saved search correctly', async () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.deleteSavedSearch('saved-id')
    })

    expect(mockWineSearchService.deleteSavedSearch).toHaveBeenCalledWith('saved-id')
  })

  it('should apply quick filter correctly', () => {
    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    const quickFilter = {
      id: 'red-wines',
      name: 'Red Wines',
      filters: { type: ['red' as const] }
    }

    act(() => {
      result.current.applyQuickFilter(quickFilter)
    })

    expect(result.current.filters.type).toEqual(['red'])
    expect(result.current.filters.page).toBe(1)
  })

  it('should handle search errors gracefully', async () => {
    mockWineSearchService.searchWines.mockRejectedValue(new Error('Search failed'))

    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.search()
    })

    expect(result.current.error).toBe('Search failed')
    expect(result.current.isLoading).toBe(false)
  })

  it('should auto-search when enabled and filters change', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useWineSearch({ 
      autoSearch: true, 
      debounceMs: 300 
    }))

    act(() => {
      result.current.updateFilter('query', 'test')
    })

    // Fast-forward time to trigger debounced search
    act(() => {
      vi.advanceTimersByTime(350) // Slightly more than debounce time
    })

    // Wait for the search to be called
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mockWineSearchService.searchWines).toHaveBeenCalled()

    vi.useRealTimers()
  }, 10000) // Increase timeout

  it('should not search when user is not available', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useWineSearch({ autoSearch: false }))

    await act(async () => {
      await result.current.search()
    })

    expect(mockWineSearchService.searchWines).not.toHaveBeenCalled()
  })

  it('should load facets when enabled', async () => {
    const { result } = renderHook(() => useWineSearch({ 
      autoSearch: false,
      enableFacets: true 
    }))

    await act(async () => {
      await result.current.search()
    })

    expect(mockWineSearchService.getSearchFacets).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Object)
    )
    expect(result.current.facets).toEqual(mockFacets)
  })

  it('should not load facets when disabled', async () => {
    const { result } = renderHook(() => useWineSearch({ 
      autoSearch: false,
      enableFacets: false 
    }))

    await act(async () => {
      await result.current.search()
    })

    expect(mockWineSearchService.getSearchFacets).not.toHaveBeenCalled()
    expect(result.current.facets).toBeNull()
  })
})