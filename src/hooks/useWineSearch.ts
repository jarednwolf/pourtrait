import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { WineSearchService } from '@/lib/services/wine-search'
import type { 
  SearchFilters, 
  SearchResult, 
  SearchFacets, 
  SearchSuggestion,
  SavedSearch,
  QuickFilter
} from '@/types'
import { QUICK_FILTERS, DEFAULT_SEARCH_CONFIG } from '@/types/search'
import type { Wine } from '@/types'

interface UseWineSearchOptions {
  autoSearch?: boolean
  debounceMs?: number
  enableFacets?: boolean
  enableSuggestions?: boolean
}

interface UseWineSearchReturn {
  // Search state
  results: SearchResult<Wine> | null
  facets: SearchFacets | null
  suggestions: SearchSuggestion[]
  isLoading: boolean
  isLoadingFacets: boolean
  isLoadingSuggestions: boolean
  error: string | null
  
  // Search filters
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  updateFilter: (key: keyof SearchFilters, value: any) => void
  clearFilters: () => void
  
  // Search actions
  search: (newFilters?: SearchFilters) => Promise<void>
  loadMore: () => Promise<void>
  
  // Suggestions
  getSuggestions: (query: string) => Promise<void>
  clearSuggestions: () => void
  
  // Saved searches
  savedSearches: SavedSearch[]
  saveCurrentSearch: (name: string, isDefault?: boolean) => Promise<void>
  loadSavedSearch: (savedSearch: SavedSearch) => void
  deleteSavedSearch: (searchId: string) => Promise<void>
  
  // Quick filters
  quickFilters: QuickFilter[]
  applyQuickFilter: (quickFilter: QuickFilter) => void
  
  // Utility
  hasActiveFilters: boolean
  canLoadMore: boolean
}

export function useWineSearch(options: UseWineSearchOptions = {}): UseWineSearchReturn {
  const {
    autoSearch = true,
    debounceMs = DEFAULT_SEARCH_CONFIG.debounceMs,
    enableFacets = true,
    enableSuggestions = true
  } = options

  const { user } = useAuth()
  
  // State
  const [results, setResults] = useState<SearchResult<Wine> | null>(null)
  const [facets, setFacets] = useState<SearchFacets | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFacets, setIsLoadingFacets] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFiltersState] = useState<SearchFilters>({
    page: 1,
    limit: DEFAULT_SEARCH_CONFIG.limit
  })

  // Debounced search effect
  useEffect(() => {
    if (!autoSearch || !user) {return}

    const timer = setTimeout(() => {
      if (filters.query || hasActiveFilters) {
        search()
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [filters, user, autoSearch, debounceMs])

  // Load saved searches on mount
  useEffect(() => {
    if (user) {
      loadSavedSearches()
    }
  }, [user])

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.query ||
      (filters.type && filters.type.length > 0) ||
      (filters.region && filters.region.length > 0) ||
      (filters.country && filters.country.length > 0) ||
      (filters.producer && filters.producer.length > 0) ||
      (filters.varietal && filters.varietal.length > 0) ||
      (filters.drinkingWindowStatus && filters.drinkingWindowStatus.length > 0) ||
      filters.vintage ||
      filters.priceRange ||
      filters.rating ||
      filters.quantity ||
      filters.purchaseDate
    )
  }, [filters])

  const canLoadMore = useMemo(() => {
    return results ? results.hasMore : false
  }, [results])

  const quickFilters = useMemo(() => {
    return QUICK_FILTERS
  }, [])

  // Search function
  const search = useCallback(async (newFilters?: SearchFilters) => {
    if (!user) {return}

    try {
      setIsLoading(true)
      setError(null)

      const searchFilters = newFilters || filters
      const searchResults = await WineSearchService.searchWines(user.id, searchFilters)
      
      setResults(searchResults)

      // Record search history if there's a query
      if (searchFilters.query) {
        WineSearchService.recordSearchHistory(
          user.id,
          searchFilters.query,
          searchFilters,
          searchResults.total
        ).catch(console.warn) // Don't fail on history recording error
      }

      // Load facets if enabled
      if (enableFacets) {
        loadFacets(searchFilters)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, filters, enableFacets])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!user || !results || !canLoadMore) {return}

    try {
      setIsLoading(true)
      
      const nextPageFilters = {
        ...filters,
        page: (filters.page || 1) + 1
      }

      const moreResults = await WineSearchService.searchWines(user.id, nextPageFilters)
      
      setResults(prev => prev ? {
        ...moreResults,
        items: [...prev.items, ...moreResults.items]
      } : moreResults)

      setFiltersState(nextPageFilters)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more results')
    } finally {
      setIsLoading(false)
    }
  }, [user, results, filters, canLoadMore])

  // Load facets
  const loadFacets = useCallback(async (searchFilters: SearchFilters) => {
    if (!user) {return}

    try {
      setIsLoadingFacets(true)
      const searchFacets = await WineSearchService.getSearchFacets(user.id, searchFilters)
      setFacets(searchFacets)
    } catch (err) {
      console.warn('Failed to load facets:', err)
    } finally {
      setIsLoadingFacets(false)
    }
  }, [user])

  // Get suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!user || !enableSuggestions || query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      setIsLoadingSuggestions(true)
      const searchSuggestions = await WineSearchService.getSearchSuggestions(
        user.id, 
        query, 
        DEFAULT_SEARCH_CONFIG.maxSuggestions
      )
      setSuggestions(searchSuggestions)
    } catch (err) {
      console.warn('Failed to get suggestions:', err)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [user, enableSuggestions])

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  // Filter management
  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState({ ...newFilters, page: 1 }) // Reset to first page
  }, [])

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({
      page: 1,
      limit: DEFAULT_SEARCH_CONFIG.limit
    })
    setResults(null)
    setFacets(null)
    setSuggestions([])
  }, [])

  // Saved searches
  const loadSavedSearches = useCallback(async () => {
    if (!user) {return}

    try {
      const searches = await WineSearchService.getSavedSearches(user.id)
      setSavedSearches(searches)
    } catch (err) {
      console.warn('Failed to load saved searches:', err)
    }
  }, [user])

  const saveCurrentSearch = useCallback(async (name: string, isDefault: boolean = false) => {
    if (!user) {return}

    try {
      const savedSearch = await WineSearchService.saveSearch(user.id, name, filters, isDefault)
      setSavedSearches(prev => [...prev, savedSearch])
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save search')
    }
  }, [user, filters])

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters)
  }, [setFilters])

  const deleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      await WineSearchService.deleteSavedSearch(searchId)
      setSavedSearches(prev => prev.filter(s => s.id !== searchId))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete saved search')
    }
  }, [])

  // Quick filters
  const applyQuickFilter = useCallback((quickFilter: QuickFilter) => {
    setFilters({
      ...filters,
      ...quickFilter.filters,
      page: 1
    })
  }, [filters, setFilters])

  return {
    // Search state
    results,
    facets,
    suggestions,
    isLoading,
    isLoadingFacets,
    isLoadingSuggestions,
    error,
    
    // Search filters
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    
    // Search actions
    search,
    loadMore,
    
    // Suggestions
    getSuggestions,
    clearSuggestions,
    
    // Saved searches
    savedSearches,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    
    // Quick filters
    quickFilters,
    applyQuickFilter,
    
    // Utility
    hasActiveFilters,
    canLoadMore
  }
}