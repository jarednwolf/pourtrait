/**
 * Wine Data Enrichment Service (Fixed Version)
 * 
 * Automatically enriches wine data with external sources when wines are added
 * or when users request data updates. Integrates with the existing wine service.
 */

import { Wine, WineInput, ExternalWineData } from '@/types'
import { WineService } from './wine-service'
import { ExternalWineDataService, WineSearchQuery, DataEnrichmentResult } from './external-wine-data'
import { supabase } from '@/lib/supabase'

// ============================================================================
// Types for Wine Enrichment
// ============================================================================

export interface EnrichmentOptions {
  forceRefresh?: boolean
  sources?: string[]
  timeout?: number
  includeImages?: boolean
}

export interface EnrichmentResult {
  success: boolean
  wine: Wine
  enrichmentData?: ExternalWineData
  sources?: string[]
  confidence?: number
  errors?: string[]
  cached?: boolean
}

export interface BulkEnrichmentResult {
  processed: number
  successful: number
  failed: number
  results: EnrichmentResult[]
  errors: string[]
}

// Type conversion utilities
function convertDbWineToAppWine(dbWine: any): Wine {
  return {
    id: dbWine.id,
    userId: dbWine.user_id,
    name: dbWine.name,
    producer: dbWine.producer,
    vintage: dbWine.vintage,
    region: dbWine.region,
    country: dbWine.country,
    varietal: dbWine.varietal,
    type: dbWine.type as Wine['type'],
    quantity: dbWine.quantity,
    purchasePrice: dbWine.purchase_price,
    purchaseDate: dbWine.purchase_date ? new Date(dbWine.purchase_date) : undefined,
    drinkingWindow: dbWine.drinking_window as any,
    personalRating: dbWine.personal_rating,
    personalNotes: dbWine.personal_notes,
    imageUrl: dbWine.image_url,
    externalData: dbWine.external_data || {},
    createdAt: new Date(dbWine.created_at),
    updatedAt: new Date(dbWine.updated_at)
  }
}

// ============================================================================
// Wine Enrichment Service
// ============================================================================

export class WineEnrichmentService {
  private static readonly DEFAULT_TIMEOUT = 10000 // 10 seconds
  private static readonly ENRICHMENT_THRESHOLD = 0.6 // Minimum confidence to apply enrichment

  /**
   * Enrich a single wine with external data
   */
  static async enrichWine(
    wineId: string,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    try {
      // Get the wine from database
      const dbWine: any = await WineService.getWineById(wineId)
      if (!dbWine) {
        return {
          success: false,
          wine: {} as Wine,
          errors: ['Wine not found']
        }
      }

      const wine = convertDbWineToAppWine(dbWine)

      // Check if enrichment is needed
      if (!options.forceRefresh && this.isRecentlyEnriched(wine.externalData)) {
        return {
          success: true,
          wine,
          cached: true
        }
      }

      // Create search query from wine data
      const searchQuery: WineSearchQuery = {
        name: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        region: wine.region,
        varietal: wine.varietal,
        type: wine.type
      }

      // Enrich with external data
      const enrichmentResult = await this.performEnrichment(searchQuery, options)
      
      if (!enrichmentResult.success) {
        return {
          success: false,
          wine,
          errors: enrichmentResult.errors
        }
      }

      // Update wine with enrichment if confidence is high enough
      if (enrichmentResult.confidence >= this.ENRICHMENT_THRESHOLD) {
        const updatedDbWine = await this.updateWineWithEnrichment(dbWine, enrichmentResult.enrichedData)
        const updatedWine = convertDbWineToAppWine(updatedDbWine)
        
        return {
          success: true,
          wine: updatedWine,
          enrichmentData: enrichmentResult.enrichedData,
          sources: enrichmentResult.sources,
          confidence: enrichmentResult.confidence
        }
      } else {
        return {
          success: true,
          wine,
          enrichmentData: enrichmentResult.enrichedData,
          sources: enrichmentResult.sources,
          confidence: enrichmentResult.confidence,
          errors: ['Confidence too low to apply enrichment']
        }
      }

    } catch (error) {
      return {
        success: false,
        wine: {} as Wine,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Enrich wine data during the add process
   */
  static async enrichWineOnAdd(
    userId: string,
    wineData: WineInput,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    try {
      // Create search query from input data
      const searchQuery: WineSearchQuery = {
        name: wineData.name,
        producer: wineData.producer,
        vintage: wineData.vintage,
        region: wineData.region,
        varietal: wineData.varietal,
        type: wineData.type
      }

      // Perform enrichment
      const enrichmentResult = await this.performEnrichment(searchQuery, options)

      // Add wine to database (with or without enrichment)
      const dbWine: any = await WineService.addWine(userId, wineData)
      const wine = convertDbWineToAppWine(dbWine)

      // Update with enrichment if successful and confident
      if (enrichmentResult.success && enrichmentResult.confidence >= this.ENRICHMENT_THRESHOLD) {
        const updatedDbWine = await this.updateWineWithEnrichment(dbWine, enrichmentResult.enrichedData)
        const updatedWine = convertDbWineToAppWine(updatedDbWine)
        
        return {
          success: true,
          wine: updatedWine,
          enrichmentData: enrichmentResult.enrichedData,
          sources: enrichmentResult.sources,
          confidence: enrichmentResult.confidence
        }
      }

      return {
        success: true,
        wine,
        enrichmentData: enrichmentResult.enrichedData,
        sources: enrichmentResult.sources,
        confidence: enrichmentResult.confidence,
        errors: enrichmentResult.errors
      }

    } catch (error) {
      return {
        success: false,
        wine: {} as Wine,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Bulk enrich multiple wines
   */
  static async bulkEnrichWines(
    wineIds: string[],
    options: EnrichmentOptions = {}
  ): Promise<BulkEnrichmentResult> {
    const results: EnrichmentResult[] = []
    const errors: string[] = []
    let successful = 0
    let failed = 0

    // Process wines in batches to avoid overwhelming external APIs
    const batchSize = 5
    for (let i = 0; i < wineIds.length; i += batchSize) {
      const batch = wineIds.slice(i, i + batchSize)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (wineId) => {
        try {
          const result = await this.enrichWine(wineId, options)
          if (result.success) {
            successful++
          } else {
            failed++
            if (result.errors) {
              errors.push(...result.errors)
            }
          }
          return result
        } catch (error) {
          failed++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Wine ${wineId}: ${errorMsg}`)
          return {
            success: false,
            wine: {} as Wine,
            errors: [errorMsg]
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + batchSize < wineIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      processed: wineIds.length,
      successful,
      failed,
      results,
      errors
    }
  }

  /**
   * Get enrichment suggestions for a wine
   */
  static async getEnrichmentSuggestions(wineId: string): Promise<{
    suggestions: string[]
    missingData: string[]
    confidence: number
  }> {
    const dbWine: any = await WineService.getWineById(wineId)
    if (!dbWine) {
      return {
        suggestions: [],
        missingData: ['Wine not found'],
        confidence: 0
      }
    }

    const wine = convertDbWineToAppWine(dbWine)
    const suggestions: string[] = []
    const missingData: string[] = []
    const externalData = wine.externalData || {}

    // Check what data is missing
    if (!externalData.professionalRatings || (Array.isArray(externalData.professionalRatings) && externalData.professionalRatings.length === 0)) {
      missingData.push('Professional ratings')
      suggestions.push('Add professional wine ratings from critics and publications')
    }

    if (!externalData.tastingNotes) {
      missingData.push('Tasting notes')
      suggestions.push('Add professional tasting notes and flavor descriptions')
    }

    if (!externalData.alcoholContent) {
      missingData.push('Alcohol content')
      suggestions.push('Add alcohol by volume (ABV) information')
    }

    if (!externalData.servingTemperature) {
      missingData.push('Serving temperature')
      suggestions.push('Add optimal serving temperature range')
    }

    if (!externalData.agingPotential) {
      missingData.push('Aging potential')
      suggestions.push('Add aging potential and cellaring recommendations')
    }

    // Calculate confidence based on data freshness and completeness
    const freshness = externalData.lastUpdated 
      ? ExternalWineDataService.getDataFreshness(new Date(externalData.lastUpdated))
      : 0
    const completeness = 1 - (missingData.length / 5) // 5 total data points
    const confidence = (freshness + completeness) / 2

    return {
      suggestions,
      missingData,
      confidence
    }
  }

  /**
   * Perform the actual enrichment with external services
   */
  private static async performEnrichment(
    searchQuery: WineSearchQuery,
    options: EnrichmentOptions
  ): Promise<DataEnrichmentResult> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT

    try {
      // Create a promise that will timeout
      const enrichmentPromise = ExternalWineDataService.enrichWineData(searchQuery)
      const timeoutPromise = new Promise<DataEnrichmentResult>((_, reject) => {
        setTimeout(() => reject(new Error('Enrichment timeout')), timeout)
      })

      // Race between enrichment and timeout
      const result = await Promise.race([enrichmentPromise, timeoutPromise])
      return result

    } catch (error) {
      return {
        success: false,
        enrichedData: {},
        sources: [],
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Update wine with enriched data
   */
  private static async updateWineWithEnrichment(
    dbWine: any,
    enrichedData: ExternalWineData
  ): Promise<any> {
    // Merge existing external data with new enriched data
    const existingData = dbWine.external_data || {}
    const mergedExternalData = {
      ...existingData,
      ...enrichedData,
      lastUpdated: new Date().toISOString()
    }

    // Merge professional ratings (avoid duplicates)
    if (existingData.professionalRatings && enrichedData.professionalRatings) {
      const existingRatings = existingData.professionalRatings
      const newRatings = enrichedData.professionalRatings.filter(
        (newRating: any) => !existingRatings.some(
          (existing: any) => existing.source === newRating.source && 
                     existing.reviewer === newRating.reviewer
        )
      )
      mergedExternalData.professionalRatings = [...existingRatings, ...newRatings]
    }

    // Update wine in database
    const { data, error } = await supabase
      .from('wines')
      .update({ external_data: mergedExternalData as any })
      .eq('id', dbWine.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update wine with enriched data: ${error.message}`)
    }

    return data
  }

  /**
   * Check if wine was recently enriched
   */
  private static isRecentlyEnriched(externalData: ExternalWineData): boolean {
    if (!externalData || !externalData.lastUpdated) {return false}

    const daysSinceUpdate = (Date.now() - new Date(externalData.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate < 7 // Consider recent if updated within a week
  }

  /**
   * Get enrichment statistics for a user's collection
   */
  static async getEnrichmentStats(userId: string): Promise<{
    totalWines: number
    enrichedWines: number
    enrichmentRate: number
    averageConfidence: number
    lastEnrichment?: Date
  }> {
    const dbWines: any[] = await WineService.getInventory(userId)
    const wines = dbWines.map(convertDbWineToAppWine)
    
    const totalWines = wines.length
    const enrichedWines = wines.filter(wine => {
      const externalData = wine.externalData || {}
      return externalData.professionalRatings && 
             Array.isArray(externalData.professionalRatings) && 
             externalData.professionalRatings.length > 0
    }).length

    const enrichmentRate = totalWines > 0 ? enrichedWines / totalWines : 0

    // Calculate average confidence from validation scores
    const confidenceScores = wines
      .filter(wine => {
        const externalData = wine.externalData || {}
        return externalData.lastUpdated
      })
      .map(wine => {
        const externalData = wine.externalData || {}
        try {
          const validation = ExternalWineDataService.validateWineData(externalData as any)
          return validation ? validation.score : 0
        } catch {
          return 0
        }
      })
      .filter(score => !isNaN(score) && score > 0)

    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0

    // Find most recent enrichment
    const lastEnrichmentDates = wines
      .map(wine => {
        const externalData = wine.externalData || {}
        return externalData.lastUpdated
      })
      .filter(date => date)
      .map(date => new Date(date!))
      .sort((a, b) => b.getTime() - a.getTime())

    const lastEnrichment = lastEnrichmentDates.length > 0 ? lastEnrichmentDates[0] : undefined

    return {
      totalWines,
      enrichedWines,
      enrichmentRate,
      averageConfidence,
      lastEnrichment
    }
  }
}