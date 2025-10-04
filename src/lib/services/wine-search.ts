import { supabase } from '@/lib/supabase'
import type { Wine } from '@/types'
import type { 
  SearchFilters, 
  SearchResult, 
  SearchFacets, 
  SearchSuggestion,
  SavedSearch,
  SearchHistory,
  FacetCount
} from '@/types'

export class WineSearchService {
  /**
   * Perform comprehensive wine search with filtering, sorting, and faceting
   */
  static async searchWines(
    userId: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult<Wine>> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    // Build the base query
    let query = supabase
      .from('wines')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Apply text search with full-text search capabilities
    if (filters.query && filters.query.trim()) {
      const searchQuery = filters.query.trim()
      
      // Use PostgreSQL full-text search with ranking
      query = query.or(`
        name.ilike.%${searchQuery}%,
        producer.ilike.%${searchQuery}%,
        region.ilike.%${searchQuery}%,
        country.ilike.%${searchQuery}%,
        personal_notes.ilike.%${searchQuery}%,
        varietal.cs.{${searchQuery}}
      `)
    }

    // Apply wine type filters
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    // Apply varietal filters
    if (filters.varietal && filters.varietal.length > 0) {
      // Use array overlap operator for varietal matching
      query = query.overlaps('varietal', filters.varietal)
    }

    // Apply region filters
    if (filters.region && filters.region.length > 0) {
      query = query.in('region', filters.region)
    }

    // Apply country filters
    if (filters.country && filters.country.length > 0) {
      query = query.in('country', filters.country)
    }

    // Apply producer filters
    if (filters.producer && filters.producer.length > 0) {
      query = query.in('producer', filters.producer)
    }

    // Apply vintage range
    if (filters.vintage) {
      if (filters.vintage.min !== undefined) {
        query = query.gte('vintage', filters.vintage.min)
      }
      if (filters.vintage.max !== undefined) {
        query = query.lte('vintage', filters.vintage.max)
      }
    }

    // Apply price range
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        query = query.gte('purchase_price', filters.priceRange.min)
      }
      if (filters.priceRange.max !== undefined) {
        query = query.lte('purchase_price', filters.priceRange.max)
      }
    }

    // Apply rating range
    if (filters.rating) {
      if (filters.rating.min !== undefined) {
        query = query.gte('personal_rating', filters.rating.min)
      }
      if (filters.rating.max !== undefined) {
        query = query.lte('personal_rating', filters.rating.max)
      }
    }

    // Apply drinking window status filter
    if (filters.drinkingWindowStatus && filters.drinkingWindowStatus.length > 0) {
      // This requires a custom function or view that calculates current status
      const statusConditions = filters.drinkingWindowStatus.map(status => 
        `drinking_window->>'currentStatus' = '${status}'`
      ).join(' OR ')
      
      query = query.or(statusConditions)
    }

    // Apply quantity filter
    if (filters.quantity) {
      if (filters.quantity.min !== undefined) {
        query = query.gte('quantity', filters.quantity.min)
      }
      if (filters.quantity.max !== undefined) {
        query = query.lte('quantity', filters.quantity.max)
      }
    }

    // Apply purchase date range
    if (filters.purchaseDate) {
      if (filters.purchaseDate.from) {
        query = query.gte('purchase_date', filters.purchaseDate.from.toISOString().split('T')[0])
      }
      if (filters.purchaseDate.to) {
        query = query.lte('purchase_date', filters.purchaseDate.to.toISOString().split('T')[0])
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      const column = this.mapSortColumn(filters.sortBy)
      const ascending = filters.sortOrder === 'asc'
      
      if (filters.sortBy === 'relevance' && filters.query) {
        // For relevance sorting, we'll handle this client-side after fetching
        query = query.order('name', { ascending: true })
      } else {
        query = query.order(column, { ascending })
      }
    } else {
      // Default sorting
      query = query.order('name', { ascending: true })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }

    let wines = (data || []) as any[]

    // Map DB fields to domain type where necessary
    const mapDbToWine = (db: any): Wine => ({
      id: db.id,
      userId: db.user_id,
      name: db.name,
      producer: db.producer,
      vintage: db.vintage,
      region: db.region,
      country: db.country,
      varietal: db.varietal || [],
      type: db.type,
      quantity: db.quantity || 0,
      purchasePrice: db.purchase_price ?? undefined,
      purchaseDate: db.purchase_date ? new Date(db.purchase_date) : undefined,
      personalRating: db.personal_rating ?? undefined,
      personalNotes: db.personal_notes ?? undefined,
      imageUrl: db.image_url ?? undefined,
      drinkingWindow: (db.drinking_window || {}) as any,
      externalData: db.external_data || {},
      createdAt: new Date(db.created_at),
      updatedAt: new Date(db.updated_at)
    })

    // Apply relevance scoring if searching by text
    if (filters.sortBy === 'relevance' && filters.query) {
      wines = this.scoreAndSortByRelevance(wines.map(mapDbToWine), filters.query)
    } else {
      wines = wines.map(mapDbToWine)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      items: wines,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    }
  }

  /**
   * Get search facets for building filter UI
   */
  static async getSearchFacets(userId: string, currentFilters: SearchFilters = {}): Promise<SearchFacets> {
    // Build base query with current filters (excluding the facet we're calculating)
    const buildBaseQuery = (excludeFilter?: keyof SearchFilters) => {
      let query = supabase
        .from('wines')
        .select('*')
        .eq('user_id', userId)

      // Apply all filters except the one we're calculating facets for
      if (currentFilters.query && excludeFilter !== 'query') {
        const searchQuery = currentFilters.query.trim()
        query = query.or(`
          name.ilike.%${searchQuery}%,
          producer.ilike.%${searchQuery}%,
          region.ilike.%${searchQuery}%,
          country.ilike.%${searchQuery}%,
          personal_notes.ilike.%${searchQuery}%
        `)
      }

      if (currentFilters.type && excludeFilter !== 'type') {
        query = query.in('type', currentFilters.type)
      }

      if (currentFilters.region && excludeFilter !== 'region') {
        query = query.in('region', currentFilters.region)
      }

      // Add other filters as needed...

      return query
    }

    // Get all wines for facet calculation
    const { data: wines } = await buildBaseQuery().select('*')
    
    if (!wines) {
      return this.getEmptyFacets()
    }

    // Calculate facets
    const facets: SearchFacets = {
      types: this.calculateFacetCounts(wines, 'type'),
      regions: this.calculateFacetCounts(wines, 'region'),
      countries: this.calculateFacetCounts(wines, 'country'),
      producers: this.calculateFacetCounts(wines, 'producer'),
      varietals: this.calculateVarietalFacets(wines),
      vintages: this.calculateVintageFacets(wines),
      drinkingWindowStatus: this.calculateDrinkingWindowFacets(wines),
      priceRanges: this.calculatePriceRangeFacets(wines),
      ratingRanges: this.calculateRatingRangeFacets(wines)
    }

    return facets
  }

  /**
   * Get search suggestions based on partial query
   */
  static async getSearchSuggestions(
    userId: string, 
    query: string, 
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return []
    }

    const searchQuery = query.trim().toLowerCase()
    const suggestions: SearchSuggestion[] = []

    // Get wines for suggestions
    const { data: wines } = await supabase
      .from('wines')
      .select('name, producer, region, varietal')
      .eq('user_id', userId)
      .or(`
        name.ilike.%${searchQuery}%,
        producer.ilike.%${searchQuery}%,
        region.ilike.%${searchQuery}%
      `)
      .limit(50)

    if (!wines) return suggestions

    // Collect unique suggestions
    const uniqueNames = new Set<string>()
    const uniqueProducers = new Set<string>()
    const uniqueRegions = new Set<string>()
    const uniqueVarietals = new Set<string>()

    wines.forEach(wine => {
      if (wine.name.toLowerCase().includes(searchQuery)) {
        uniqueNames.add(wine.name)
      }
      if (wine.producer.toLowerCase().includes(searchQuery)) {
        uniqueProducers.add(wine.producer)
      }
      if (wine.region.toLowerCase().includes(searchQuery)) {
        uniqueRegions.add(wine.region)
      }
      wine.varietal?.forEach(v => {
        if (v.toLowerCase().includes(searchQuery)) {
          uniqueVarietals.add(v)
        }
      })
    })

    // Add suggestions with type and count
    Array.from(uniqueNames).slice(0, 3).forEach(name => {
      suggestions.push({
        type: 'wine',
        value: name,
        label: name,
        count: wines.filter(w => w.name === name).length
      })
    })

    Array.from(uniqueProducers).slice(0, 3).forEach(producer => {
      suggestions.push({
        type: 'producer',
        value: producer,
        label: producer,
        count: wines.filter(w => w.producer === producer).length
      })
    })

    Array.from(uniqueRegions).slice(0, 2).forEach(region => {
      suggestions.push({
        type: 'region',
        value: region,
        label: region,
        count: wines.filter(w => w.region === region).length
      })
    })

    Array.from(uniqueVarietals).slice(0, 2).forEach(varietal => {
      suggestions.push({
        type: 'varietal',
        value: varietal,
        label: varietal,
        count: wines.filter(w => w.varietal?.includes(varietal)).length
      })
    })

    return suggestions.slice(0, limit)
  }

  /**
   * Save a search for future use
   */
  static async saveSearch(
    userId: string, 
    name: string, 
    filters: SearchFilters,
    isDefault: boolean = false
  ): Promise<SavedSearch> {
    const savedSearch = {
      user_id: userId,
      name,
      filters: JSON.stringify(filters),
      is_default: isDefault
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .insert(savedSearch)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save search: ${error.message}`)
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      filters: JSON.parse(data.filters),
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Get user's saved searches
   */
  static async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to get saved searches: ${error.message}`)
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      filters: JSON.parse(item.filters),
      isDefault: item.is_default,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }))
  }

  /**
   * Delete a saved search
   */
  static async deleteSavedSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)

    if (error) {
      throw new Error(`Failed to delete saved search: ${error.message}`)
    }
  }

  /**
   * Record search in history
   */
  static async recordSearchHistory(
    userId: string,
    query: string,
    filters: SearchFilters,
    resultCount: number
  ): Promise<void> {
    const searchHistory = {
      user_id: userId,
      query,
      filters: JSON.stringify(filters),
      result_count: resultCount
    }

    const { error } = await supabase
      .from('search_history')
      .insert(searchHistory)

    if (error) {
      console.warn('Failed to record search history:', error.message)
      // Don't throw error for history recording failure
    }
  }

  // Private helper methods

  private static scoreAndSortByRelevance(wines: Wine[], query: string): Wine[] {
    const queryLower = query.toLowerCase()
    
    return wines
      .map(wine => ({
        wine,
        score: this.calculateRelevanceScore(wine, queryLower)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.wine)
  }

  private static calculateRelevanceScore(wine: Wine, query: string): number {
    let score = 0
    
    // Exact matches get highest score
    if (wine.name.toLowerCase() === query) score += 100
    if (wine.producer.toLowerCase() === query) score += 80
    
    // Starts with matches
    if (wine.name.toLowerCase().startsWith(query)) score += 50
    if (wine.producer.toLowerCase().startsWith(query)) score += 40
    
    // Contains matches with field weights
    if (wine.name.toLowerCase().includes(query)) score += 30
    if (wine.producer.toLowerCase().includes(query)) score += 25
    if (wine.region.toLowerCase().includes(query)) score += 15
    if (wine.country.toLowerCase().includes(query)) score += 8
    if (wine.personal_notes?.toLowerCase().includes(query)) score += 10
    
    // Varietal matches
    wine.varietal?.forEach(v => {
      if (v.toLowerCase().includes(query)) score += 20
    })
    
    return score
  }

  private static calculateFacetCounts(wines: Wine[], field: keyof Wine): FacetCount[] {
    const counts = new Map<string, number>()
    
    wines.forEach(wine => {
      const value = wine[field]
      if (value && typeof value === 'string') {
        counts.set(value, (counts.get(value) || 0) + 1)
      }
    })
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, label: value }))
      .sort((a, b) => b.count - a.count)
  }

  private static calculateVarietalFacets(wines: Wine[]): FacetCount[] {
    const counts = new Map<string, number>()
    
    wines.forEach(wine => {
      wine.varietal?.forEach(varietal => {
        counts.set(varietal, (counts.get(varietal) || 0) + 1)
      })
    })
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, label: value }))
      .sort((a, b) => b.count - a.count)
  }

  private static calculateVintageFacets(wines: Wine[]): FacetCount[] {
    const counts = new Map<string, number>()
    
    wines.forEach(wine => {
      const vintage = wine.vintage?.toString()
      if (vintage) {
        counts.set(vintage, (counts.get(vintage) || 0) + 1)
      }
    })
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, label: value }))
      .sort((a, b) => parseInt(b.value) - parseInt(a.value))
  }

  private static calculateDrinkingWindowFacets(wines: Wine[]): FacetCount[] {
    const counts = new Map<string, number>()
    
    wines.forEach(wine => {
      const status = (wine.drinkingWindow as any)?.currentStatus
      if (status) {
        counts.set(status, (counts.get(status) || 0) + 1)
      }
    })
    
    const statusLabels: Record<string, string> = {
      'too_young': 'Too Young',
      'ready': 'Ready',
      'peak': 'Peak',
      'declining': 'Declining',
      'over_hill': 'Past Prime'
    }
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ 
        value, 
        count, 
        label: statusLabels[value] || value 
      }))
  }

  private static calculatePriceRangeFacets(wines: Wine[]): FacetCount[] {
    const ranges = [
      { min: 0, max: 25, label: 'Under $25' },
      { min: 25, max: 50, label: '$25 - $50' },
      { min: 50, max: 100, label: '$50 - $100' },
      { min: 100, max: 200, label: '$100 - $200' },
      { min: 200, max: Infinity, label: 'Over $200' }
    ]
    
    return ranges.map(range => {
      const count = wines.filter(wine => {
        const price = wine.purchasePrice
        if (!price) return false
        
        if (range.max === Infinity) {
          return price >= range.min
        } else {
          return price >= range.min && price <= range.max
        }
      }).length
      
      return {
        value: `${range.min}-${range.max === Infinity ? 'max' : range.max}`,
        count,
        label: range.label
      }
    }).filter(facet => facet.count > 0)
  }

  private static calculateRatingRangeFacets(wines: Wine[]): FacetCount[] {
    const ranges = [
      { min: 9, max: 10, label: '9-10 Stars' },
      { min: 7, max: 8.9, label: '7-8 Stars' },
      { min: 5, max: 6.9, label: '5-6 Stars' },
      { min: 1, max: 4.9, label: '1-4 Stars' }
    ]
    
    return ranges.map(range => {
      const count = wines.filter(wine => {
        const rating = wine.personalRating
        return rating && rating >= range.min && rating <= range.max
      }).length
      
      return {
        value: `${range.min}-${range.max}`,
        count,
        label: range.label
      }
    }).filter(facet => facet.count > 0)
  }

  private static getEmptyFacets(): SearchFacets {
    return {
      types: [],
      regions: [],
      countries: [],
      producers: [],
      varietals: [],
      vintages: [],
      drinkingWindowStatus: [],
      priceRanges: [],
      ratingRanges: []
    }
  }

  private static mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      'name': 'name',
      'producer': 'producer',
      'vintage': 'vintage',
      'rating': 'personal_rating',
      'purchaseDate': 'purchase_date',
      'drinkingWindow': 'drinking_window',
      'price': 'purchase_price',
      'quantity': 'quantity'
    }

    return columnMap[sortBy] || 'name'
  }
}