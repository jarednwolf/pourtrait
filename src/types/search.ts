// Search and filtering types for wine inventory

export interface SearchFilters {
  // Text search
  query?: string
  
  // Wine characteristics
  type?: WineType[]
  varietal?: string[]
  region?: string[]
  country?: string[]
  producer?: string[]
  
  // Vintage range
  vintage?: {
    min?: number
    max?: number
  }
  
  // Price range
  priceRange?: {
    min?: number
    max?: number
    currency?: string
  }
  
  // Rating range
  rating?: {
    min?: number
    max?: number
  }
  
  // Drinking window status
  drinkingWindowStatus?: DrinkingWindowStatus[]
  
  // Quantity
  quantity?: {
    min?: number
    max?: number
  }
  
  // Purchase date range
  purchaseDate?: {
    from?: Date
    to?: Date
  }
  
  // Sorting
  sortBy?: SortField
  sortOrder?: 'asc' | 'desc'
  
  // Pagination
  page?: number
  limit?: number
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  filters: SearchFilters
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QuickFilter {
  id: string
  name: string
  icon?: string
  filters: Partial<SearchFilters>
  description?: string
}

export interface SearchResult<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
  facets?: SearchFacets
}

export interface SearchFacets {
  types: FacetCount[]
  regions: FacetCount[]
  countries: FacetCount[]
  producers: FacetCount[]
  varietals: FacetCount[]
  vintages: FacetCount[]
  drinkingWindowStatus: FacetCount[]
  priceRanges: FacetCount[]
  ratingRanges: FacetCount[]
}

export interface FacetCount {
  value: string
  count: number
  label?: string
}

export interface SearchSuggestion {
  type: 'wine' | 'producer' | 'region' | 'varietal'
  value: string
  label: string
  count?: number
}

export type WineType = 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified'

export type DrinkingWindowStatus = 'too_young' | 'ready' | 'peak' | 'declining' | 'over_hill'

export type SortField = 
  | 'name' 
  | 'producer' 
  | 'vintage' 
  | 'rating' 
  | 'purchaseDate' 
  | 'drinkingWindow'
  | 'relevance'
  | 'price'
  | 'quantity'

export interface SearchHistory {
  id: string
  userId: string
  query: string
  filters: SearchFilters
  resultCount: number
  searchedAt: Date
}

// Predefined quick filters
export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'ready-to-drink',
    name: 'Ready to Drink',
    icon: 'wine',
    filters: {
      drinkingWindowStatus: ['ready', 'peak']
    },
    description: 'Wines that are ready to enjoy now'
  },
  {
    id: 'drink-soon',
    name: 'Drink Soon',
    icon: 'clock',
    filters: {
      drinkingWindowStatus: ['declining']
    },
    description: 'Wines that should be consumed soon'
  },
  {
    id: 'red-wines',
    name: 'Red Wines',
    icon: 'wine',
    filters: {
      type: ['red']
    },
    description: 'All red wines in your collection'
  },
  {
    id: 'white-wines',
    name: 'White Wines',
    icon: 'wine',
    filters: {
      type: ['white']
    },
    description: 'All white wines in your collection'
  },
  {
    id: 'sparkling',
    name: 'Sparkling',
    icon: 'sparkles',
    filters: {
      type: ['sparkling']
    },
    description: 'Champagne and sparkling wines'
  },
  {
    id: 'highly-rated',
    name: 'Highly Rated',
    icon: 'star',
    filters: {
      rating: { min: 8 }
    },
    description: 'Your highest rated wines (8+ stars)'
  },
  {
    id: 'recent-purchases',
    name: 'Recent Purchases',
    icon: 'calendar',
    filters: {
      purchaseDate: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    },
    description: 'Wines purchased in the last 3 months'
  },
  {
    id: 'premium-wines',
    name: 'Premium Wines',
    icon: 'crown',
    filters: {
      priceRange: { min: 50 }
    },
    description: 'Your premium wine collection ($50+)'
  }
]

// Search field weights for relevance scoring
export const SEARCH_FIELD_WEIGHTS = {
  name: 3.0,
  producer: 2.5,
  varietal: 2.0,
  region: 1.5,
  personalNotes: 1.0,
  country: 0.8
} as const

// Default search configuration
export const DEFAULT_SEARCH_CONFIG = {
  limit: 20,
  maxSuggestions: 10,
  minQueryLength: 2,
  debounceMs: 300
} as const