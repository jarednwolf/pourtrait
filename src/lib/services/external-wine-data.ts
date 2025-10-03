/**
 * External Wine Data Integration Service
 * 
 * Integrates with multiple wine databases and APIs to enrich wine information
 * with professional ratings, tasting notes, and comprehensive wine data.
 */

import { ExternalWineData, ProfessionalRating, Wine } from '@/types'

// ============================================================================
// Types for External Wine Data
// ============================================================================

export interface WineSearchQuery {
  name?: string
  producer?: string
  vintage?: number
  region?: string
  varietal?: string[]
  type?: Wine['type']
}

export interface ExternalWineSource {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  reliability: number // 0-1 score
  dataQuality: number // 0-1 score
}

export interface WineDataResult {
  source: string
  confidence: number
  data: {
    name?: string
    producer?: string
    vintage?: number
    region?: string
    country?: string
    varietal?: string[]
    type?: Wine['type']
    alcoholContent?: number
    tastingNotes?: string
    servingTemperature?: {
      min: number
      max: number
    }
    decantingTime?: number
    agingPotential?: number
    professionalRatings?: ProfessionalRating[]
    imageUrl?: string
    wineDbId?: string
  }
  lastUpdated: Date
}

export interface DataEnrichmentResult {
  success: boolean
  enrichedData: ExternalWineData
  sources: string[]
  confidence: number
  errors?: string[]
}

// ============================================================================
// External Wine Data Sources Configuration
// ============================================================================

const WINE_DATA_SOURCES: ExternalWineSource[] = [
  {
    id: 'vivino',
    name: 'Vivino',
    baseUrl: 'https://www.vivino.com/api',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 5000
    },
    reliability: 0.85,
    dataQuality: 0.80
  },
  {
    id: 'wine_searcher',
    name: 'Wine-Searcher',
    baseUrl: 'https://www.wine-searcher.com/api',
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 1000
    },
    reliability: 0.90,
    dataQuality: 0.85
  },
  {
    id: 'cellar_tracker',
    name: 'CellarTracker',
    baseUrl: 'https://www.cellartracker.com/api',
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerDay: 500
    },
    reliability: 0.95,
    dataQuality: 0.90
  },
  {
    id: 'wine_spectator',
    name: 'Wine Spectator',
    baseUrl: 'https://www.winespectator.com/api',
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerDay: 200
    },
    reliability: 0.98,
    dataQuality: 0.95
  }
]

// ============================================================================
// Rate Limiting and Caching
// ============================================================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  canMakeRequest(sourceId: string): boolean {
    const source = WINE_DATA_SOURCES.find(s => s.id === sourceId)
    if (!source) return false

    const now = Date.now()
    const requests = this.requests.get(sourceId) || []
    
    // Clean old requests (older than 1 minute)
    const recentRequests = requests.filter(time => now - time < 60000)
    
    // Check rate limit
    if (recentRequests.length >= source.rateLimit.requestsPerMinute) {
      return false
    }

    // Update requests
    recentRequests.push(now)
    this.requests.set(sourceId, recentRequests)
    
    return true
  }
}

class WineDataCache {
  private cache: Map<string, { data: WineDataResult; expiry: number }> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  private getCacheKey(query: WineSearchQuery): string {
    return JSON.stringify({
      name: query.name?.toLowerCase(),
      producer: query.producer?.toLowerCase(),
      vintage: query.vintage,
      region: query.region?.toLowerCase()
    })
  }

  get(query: WineSearchQuery, sourceId: string): WineDataResult | null {
    const key = `${sourceId}:${this.getCacheKey(query)}`
    const cached = this.cache.get(key)
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  set(query: WineSearchQuery, sourceId: string, data: WineDataResult): void {
    const key = `${sourceId}:${this.getCacheKey(query)}`
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// ============================================================================
// External Wine Data Service
// ============================================================================

export class ExternalWineDataService {
  private static rateLimiter = new RateLimiter()
  private static cache = new WineDataCache()

  /**
   * Enrich wine data by querying multiple external sources
   */
  static async enrichWineData(query: WineSearchQuery): Promise<DataEnrichmentResult> {
    const results: WineDataResult[] = []
    const errors: string[] = []
    const sources: string[] = []

    // Query each available source
    for (const source of WINE_DATA_SOURCES) {
      try {
        const result = await this.queryWineSource(source, query)
        if (result) {
          results.push(result)
          sources.push(source.name)
        }
      } catch (error) {
        errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (results.length === 0) {
      return {
        success: false,
        enrichedData: {},
        sources: [],
        confidence: 0,
        errors
      }
    }

    // Merge and validate results
    const enrichedData = this.mergeWineData(results)
    const confidence = this.calculateConfidence(results)

    return {
      success: true,
      enrichedData,
      sources,
      confidence,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Query a specific wine data source
   */
  private static async queryWineSource(
    source: ExternalWineSource,
    query: WineSearchQuery
  ): Promise<WineDataResult | null> {
    // Check cache first
    const cached = this.cache.get(query, source.id)
    if (cached) {
      return cached
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(source.id)) {
      throw new Error(`Rate limit exceeded for ${source.name}`)
    }

    let result: WineDataResult | null = null

    // Query specific source based on ID
    switch (source.id) {
      case 'vivino':
        result = await this.queryVivino(query)
        break
      case 'wine_searcher':
        result = await this.queryWineSearcher(query)
        break
      case 'cellar_tracker':
        result = await this.queryCellarTracker(query)
        break
      case 'wine_spectator':
        result = await this.queryWineSpectator(query)
        break
      default:
        throw new Error(`Unknown source: ${source.id}`)
    }

    // Cache the result
    if (result) {
      this.cache.set(query, source.id, result)
    }

    return result
  }

  /**
   * Query Vivino API (mock implementation)
   */
  private static async queryVivino(query: WineSearchQuery): Promise<WineDataResult | null> {
    // In a real implementation, this would make actual API calls
    // For now, we'll return mock data based on the query
    
    if (!query.name && !query.producer) {
      return null
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Mock data based on common wines
    const mockData = this.generateMockWineData(query, 'vivino')
    
    return {
      source: 'vivino',
      confidence: 0.75,
      data: mockData,
      lastUpdated: new Date()
    }
  }

  /**
   * Query Wine-Searcher API (mock implementation)
   */
  private static async queryWineSearcher(query: WineSearchQuery): Promise<WineDataResult | null> {
    if (!query.name && !query.producer) {
      return null
    }

    await new Promise(resolve => setTimeout(resolve, 150))

    const mockData = this.generateMockWineData(query, 'wine_searcher')
    
    return {
      source: 'wine_searcher',
      confidence: 0.80,
      data: mockData,
      lastUpdated: new Date()
    }
  }

  /**
   * Query CellarTracker API (mock implementation)
   */
  private static async queryCellarTracker(query: WineSearchQuery): Promise<WineDataResult | null> {
    if (!query.name && !query.producer) {
      return null
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    const mockData = this.generateMockWineData(query, 'cellar_tracker')
    
    return {
      source: 'cellar_tracker',
      confidence: 0.85,
      data: mockData,
      lastUpdated: new Date()
    }
  }

  /**
   * Query Wine Spectator API (mock implementation)
   */
  private static async queryWineSpectator(query: WineSearchQuery): Promise<WineDataResult | null> {
    if (!query.name && !query.producer) {
      return null
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    const mockData = this.generateMockWineData(query, 'wine_spectator')
    
    return {
      source: 'wine_spectator',
      confidence: 0.90,
      data: mockData,
      lastUpdated: new Date()
    }
  }

  /**
   * Generate mock wine data for testing
   */
  private static generateMockWineData(query: WineSearchQuery, source: string): WineDataResult['data'] {
    const baseData = {
      name: query.name,
      producer: query.producer,
      vintage: query.vintage,
      region: query.region,
      varietal: query.varietal,
      type: query.type
    }

    // Add source-specific data
    switch (source) {
      case 'vivino':
        return {
          ...baseData,
          alcoholContent: 13.5,
          tastingNotes: 'Rich and complex with notes of dark fruit, oak, and spice.',
          professionalRatings: [
            {
              source: 'Vivino Community',
              score: 4.2,
              maxScore: 5,
              reviewDate: new Date('2023-01-15')
            }
          ],
          wineDbId: `vivino_${Math.random().toString(36).substr(2, 9)}`
        }

      case 'wine_searcher':
        return {
          ...baseData,
          servingTemperature: { min: 16, max: 18 },
          decantingTime: 60,
          professionalRatings: [
            {
              source: 'Wine Searcher',
              score: 88,
              maxScore: 100,
              reviewer: 'Professional Panel',
              reviewDate: new Date('2023-02-10')
            }
          ],
          wineDbId: `ws_${Math.random().toString(36).substr(2, 9)}`
        }

      case 'cellar_tracker':
        return {
          ...baseData,
          agingPotential: 15,
          tastingNotes: 'Elegant structure with balanced tannins and excellent aging potential.',
          professionalRatings: [
            {
              source: 'CellarTracker Community',
              score: 91,
              maxScore: 100,
              reviewDate: new Date('2023-03-05')
            }
          ],
          wineDbId: `ct_${Math.random().toString(36).substr(2, 9)}`
        }

      case 'wine_spectator':
        return {
          ...baseData,
          alcoholContent: 14.0,
          tastingNotes: 'Outstanding wine with exceptional balance and complexity. Shows great potential for cellaring.',
          servingTemperature: { min: 17, max: 19 },
          professionalRatings: [
            {
              source: 'Wine Spectator',
              score: 93,
              maxScore: 100,
              reviewer: 'James Laube',
              reviewDate: new Date('2023-04-20')
            }
          ],
          wineDbId: `ws_${Math.random().toString(36).substr(2, 9)}`
        }

      default:
        return baseData
    }
  }

  /**
   * Merge data from multiple sources with conflict resolution
   */
  private static mergeWineData(results: WineDataResult[]): ExternalWineData {
    if (results.length === 0) {
      return {}
    }

    if (results.length === 1) {
      return {
        wineDbId: results[0].data.wineDbId,
        professionalRatings: results[0].data.professionalRatings || [],
        tastingNotes: results[0].data.tastingNotes,
        alcoholContent: results[0].data.alcoholContent,
        servingTemperature: results[0].data.servingTemperature,
        decantingTime: results[0].data.decantingTime,
        agingPotential: results[0].data.agingPotential,
        lastUpdated: new Date()
      }
    }

    // Merge multiple results with weighted confidence
    const merged: ExternalWineData = {
      professionalRatings: [],
      lastUpdated: new Date()
    }

    // Collect all professional ratings
    results.forEach(result => {
      if (result.data.professionalRatings) {
        merged.professionalRatings!.push(...result.data.professionalRatings)
      }
    })

    // Use highest confidence source for single-value fields
    const sortedResults = results.sort((a, b) => b.confidence - a.confidence)
    const primaryResult = sortedResults[0]

    merged.wineDbId = primaryResult.data.wineDbId
    merged.tastingNotes = primaryResult.data.tastingNotes
    merged.alcoholContent = primaryResult.data.alcoholContent
    merged.servingTemperature = primaryResult.data.servingTemperature
    merged.decantingTime = primaryResult.data.decantingTime
    merged.agingPotential = primaryResult.data.agingPotential

    return merged
  }

  /**
   * Calculate overall confidence score from multiple results
   */
  private static calculateConfidence(results: WineDataResult[]): number {
    if (results.length === 0) return 0

    // Weight by source reliability and data quality
    let totalWeight = 0
    let weightedConfidence = 0

    results.forEach(result => {
      const source = WINE_DATA_SOURCES.find(s => s.name.toLowerCase() === result.source.toLowerCase())
      const weight = source ? (source.reliability * source.dataQuality) : 0.5
      
      totalWeight += weight
      weightedConfidence += result.confidence * weight
    })

    return totalWeight > 0 ? Math.min(weightedConfidence / totalWeight, 1) : 0
  }

  /**
   * Validate external wine data quality
   */
  static validateWineData(data: ExternalWineData): {
    isValid: boolean
    issues: string[]
    score: number
  } {
    const issues: string[] = []
    let score = 1.0

    // Check for required fields
    if (!data.wineDbId) {
      issues.push('Missing wine database ID')
      score -= 0.2
    }

    // Validate professional ratings
    if (data.professionalRatings) {
      data.professionalRatings.forEach((rating, index) => {
        if (!rating.source || rating.source.trim().length === 0) {
          issues.push(`Rating ${index + 1}: Missing source`)
          score -= 0.1
        }
        
        if (rating.score < 0 || rating.score > rating.maxScore) {
          issues.push(`Rating ${index + 1}: Invalid score range`)
          score -= 0.1
        }
      })
    }

    // Validate alcohol content
    if (data.alcoholContent !== undefined) {
      if (data.alcoholContent < 0 || data.alcoholContent > 20) {
        issues.push('Invalid alcohol content')
        score -= 0.1
      }
    }

    // Validate serving temperature
    if (data.servingTemperature) {
      if (data.servingTemperature.min >= data.servingTemperature.max) {
        issues.push('Invalid serving temperature range')
        score -= 0.1
      }
    }

    // Validate aging potential
    if (data.agingPotential !== undefined) {
      if (data.agingPotential < 0 || data.agingPotential > 100) {
        issues.push('Invalid aging potential')
        score -= 0.1
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(score, 0)
    }
  }

  /**
   * Get data freshness score based on last update
   */
  static getDataFreshness(lastUpdated?: Date): number {
    if (!lastUpdated) return 0

    const now = new Date()
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate <= 7) return 1.0      // Fresh (within a week)
    if (daysSinceUpdate <= 30) return 0.8     // Good (within a month)
    if (daysSinceUpdate <= 90) return 0.6     // Acceptable (within 3 months)
    if (daysSinceUpdate <= 365) return 0.4    // Stale (within a year)
    
    return 0.2 // Very stale (over a year)
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear()
  }
}