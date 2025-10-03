'use client'

import { useState, useCallback } from 'react'
import { 
  ExtractedWineListItem, 
  RecommendationContext 
} from '@/types'

export interface RestaurantAnalysisResult {
  totalWines: number
  processedWines: RestaurantWineMatch[]
  recommendations: RestaurantRecommendation[]
  context: RecommendationContext
  analysisMetadata: {
    processingTime: number
    matchingAccuracy: number
    recommendationConfidence: number
  }
}

export interface RestaurantWineMatch {
  extractedWine: ExtractedWineListItem
  matchedWine?: any
  confidence: number
  matchType: 'exact' | 'partial' | 'similar' | 'none'
  matchedFields: string[]
}

export interface RestaurantRecommendation {
  wine: RestaurantWineMatch
  score: number
  reasoning: string[]
  foodPairingScore?: number
  priceScore?: number
  tasteProfileScore?: number
  urgencyScore?: number
  explanation: string
}

export interface MealContext {
  dishName?: string
  cuisine?: string
  mainIngredient?: string
  cookingMethod?: string
  spiceLevel?: 'mild' | 'medium' | 'spicy'
  richness?: 'light' | 'medium' | 'rich'
  occasion?: string
}

interface UseRestaurantWineAnalysisReturn {
  // State
  isAnalyzing: boolean
  error: string | null
  analysisResult: RestaurantAnalysisResult | null
  
  // Actions
  analyzeWineList: (
    wines: ExtractedWineListItem[], 
    context?: RecommendationContext & { meal?: MealContext }
  ) => Promise<RestaurantAnalysisResult>
  clearError: () => void
  clearResult: () => void
}

export function useRestaurantWineAnalysis(): UseRestaurantWineAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<RestaurantAnalysisResult | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearResult = useCallback(() => {
    setAnalysisResult(null)
    setError(null)
  }, [])

  const analyzeWineList = useCallback(async (
    wines: ExtractedWineListItem[],
    context: RecommendationContext & { meal?: MealContext } = {}
  ): Promise<RestaurantAnalysisResult> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Validate input
      if (!wines || wines.length === 0) {
        throw new Error('No wines provided for analysis')
      }

      // Make API request
      const response = await fetch('/api/recommendations/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wines,
          context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      const analysisData = result.data as RestaurantAnalysisResult
      setAnalysisResult(analysisData)
      
      return analysisData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze restaurant wine list'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    isAnalyzing,
    error,
    analysisResult,
    analyzeWineList,
    clearError,
    clearResult
  }
}

// Utility functions for working with restaurant analysis results

export function getTopRecommendations(
  result: RestaurantAnalysisResult | null, 
  count: number = 5
): RestaurantRecommendation[] {
  if (!result) return []
  return result.recommendations.slice(0, count)
}

export function getRecommendationsByScore(
  result: RestaurantAnalysisResult | null,
  minScore: number = 0.5
): RestaurantRecommendation[] {
  if (!result) return []
  return result.recommendations.filter(rec => rec.score >= minScore)
}

export function getWinesByMatchType(
  result: RestaurantAnalysisResult | null,
  matchType: 'exact' | 'partial' | 'similar' | 'none'
): RestaurantWineMatch[] {
  if (!result) return []
  return result.processedWines.filter(wine => wine.matchType === matchType)
}

export function formatRecommendationScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function formatMatchConfidence(confidence: number): string {
  if (confidence >= 0.9) return 'Excellent match'
  if (confidence >= 0.7) return 'Good match'
  if (confidence >= 0.5) return 'Possible match'
  return 'Low confidence'
}

export function getRecommendationsByPriceRange(
  result: RestaurantAnalysisResult | null,
  minPrice: number,
  maxPrice: number
): RestaurantRecommendation[] {
  if (!result) return []
  
  return result.recommendations.filter(rec => {
    const priceStr = rec.wine.extractedWine.price
    if (!priceStr) return true // Include wines without price info
    
    const priceMatch = priceStr.match(/[\d.,]+/)
    if (!priceMatch) return true
    
    const price = parseFloat(priceMatch[0].replace(',', ''))
    return price >= minPrice && price <= maxPrice
  })
}

export function getRecommendationsByWineType(
  result: RestaurantAnalysisResult | null,
  wineType: 'red' | 'white' | 'sparkling' | 'rosé' | 'dessert' | 'fortified'
): RestaurantRecommendation[] {
  if (!result) return []
  
  return result.recommendations.filter(rec => 
    rec.wine.matchedWine?.type === wineType
  )
}