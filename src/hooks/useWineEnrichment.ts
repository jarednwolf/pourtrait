/**
 * React Hook for Wine Data Enrichment
 * 
 * Provides functionality for enriching wine data with external sources
 */

import { useState, useCallback } from 'react'
import { Wine } from '@/types'

// ============================================================================
// Types
// ============================================================================

export interface EnrichmentOptions {
  forceRefresh?: boolean
  timeout?: number
  includeImages?: boolean
}

export interface EnrichmentResult {
  success: boolean
  wine?: Wine
  enrichmentData?: any
  sources?: string[]
  confidence?: number
  cached?: boolean
  errors?: string[]
}

export interface BulkEnrichmentResult {
  success: boolean
  processed: number
  successful: number
  failed: number
  results: EnrichmentResult[]
  errors: string[]
}

export interface EnrichmentSuggestions {
  suggestions: string[]
  missingData: string[]
  confidence: number
}

export interface EnrichmentStats {
  totalWines: number
  enrichedWines: number
  enrichmentRate: number
  averageConfidence: number
  lastEnrichment?: Date
}

export interface WineKnowledge {
  wine: Wine
  characteristics: any
  regionalProfile?: any
  varietalProfiles: any[]
  expertInsights: string[]
  pairingRecommendations: string[]
  servingRecommendations: any
  confidenceScore: number
}

export interface WineEducation {
  basicInfo: string[]
  terminology: Array<{ term: string; definition: string }>
  tips: string[]
}

// ============================================================================
// Hook
// ============================================================================

export function useWineEnrichment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Enrich a single wine
  const enrichWine = useCallback(async (
    wineId: string,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wines/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wineId,
          options
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enrich wine')
      }

      return {
        success: data.success,
        wine: data.wine,
        enrichmentData: data.enrichmentData,
        sources: data.sources,
        confidence: data.confidence,
        cached: data.cached
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Bulk enrich multiple wines
  const bulkEnrichWines = useCallback(async (
    wineIds: string[],
    options: EnrichmentOptions = {}
  ): Promise<BulkEnrichmentResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wines/enrich', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wineIds,
          options
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk enrich wines')
      }

      return {
        success: data.success,
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
        results: data.results,
        errors: data.errors
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get enrichment suggestions for a wine
  const getEnrichmentSuggestions = useCallback(async (
    wineId: string
  ): Promise<EnrichmentSuggestions | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wines/enrich?wineId=${wineId}&action=suggestions`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get enrichment suggestions')
      }

      return {
        suggestions: data.suggestions,
        missingData: data.missingData,
        confidence: data.confidence
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get wine knowledge
  const getWineKnowledge = useCallback(async (
    wineId: string
  ): Promise<WineKnowledge | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wines/enrich?wineId=${wineId}&action=knowledge`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get wine knowledge')
      }

      return data.knowledge

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get wine education content
  const getWineEducation = useCallback(async (
    wineId: string
  ): Promise<WineEducation | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wines/enrich?wineId=${wineId}&action=education`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get wine education')
      }

      return data.education

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get enrichment statistics
  const getEnrichmentStats = useCallback(async (): Promise<EnrichmentStats | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wines/enrichment-stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get enrichment stats')
      }

      return {
        ...data.stats,
        lastEnrichment: data.stats.lastEnrichment ? new Date(data.stats.lastEnrichment) : undefined
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear enrichment cache
  const clearEnrichmentCache = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wines/enrichment-stats', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cache')
      }

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    loading,
    error,
    
    // Actions
    enrichWine,
    bulkEnrichWines,
    getEnrichmentSuggestions,
    getWineKnowledge,
    getWineEducation,
    getEnrichmentStats,
    clearEnrichmentCache,
    clearError
  }
}