// Food Pairing Hook
// React hook for managing food pairing recommendations

import { useState, useCallback } from 'react'
import { FoodPairingResponse, FoodPairingRequest, ContextualFilter } from '@/lib/services/food-pairing'

interface UseFoodPairingReturn {
  pairings: FoodPairingResponse | null
  contextualRecommendations: FoodPairingResponse | null
  loading: boolean
  error: string | null
  generateFoodPairings: (request: Omit<FoodPairingRequest, 'userId'>) => Promise<void>
  generateContextualRecommendations: (filters: Omit<ContextualFilter, 'availability'>) => Promise<void>
  clearPairings: () => void
  clearError: () => void
}

export function useFoodPairing(userId: string): UseFoodPairingReturn {
  const [pairings, setPairings] = useState<FoodPairingResponse | null>(null)
  const [contextualRecommendations, setContextualRecommendations] = useState<FoodPairingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFoodPairings = useCallback(async (request: Omit<FoodPairingRequest, 'userId'>) => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations/food-pairing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...request
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate food pairings')
      }

      setPairings(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error generating food pairings:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const generateContextualRecommendations = useCallback(async (filters: Omit<ContextualFilter, 'availability'>) => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        userId
      })

      // Add optional parameters
      if (filters.occasion) {searchParams.append('occasion', filters.occasion)}
      if (filters.urgency) {searchParams.append('urgency', filters.urgency)}
      if (filters.priceRange) {
        searchParams.append('priceMin', filters.priceRange.min.toString())
        searchParams.append('priceMax', filters.priceRange.max.toString())
        searchParams.append('currency', filters.priceRange.currency)
      }
      if (filters.wineType) {
        searchParams.append('wineTypes', filters.wineType.join(','))
      }

      const response = await fetch(`/api/recommendations/food-pairing?${searchParams}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate contextual recommendations')
      }

      setContextualRecommendations(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error generating contextual recommendations:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const clearPairings = useCallback(() => {
    setPairings(null)
    setContextualRecommendations(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    pairings,
    contextualRecommendations,
    loading,
    error,
    generateFoodPairings,
    generateContextualRecommendations,
    clearPairings,
    clearError
  }
}

// Utility hook for food pairing form management
export function useFoodPairingForm() {
  const [formData, setFormData] = useState({
    foodDescription: '',
    cuisine: '',
    cookingMethod: '',
    spiceLevel: 'none' as 'none' | 'mild' | 'medium' | 'hot',
    richness: 'medium' as 'light' | 'medium' | 'rich',
    occasion: '',
    priceRange: {
      min: 0,
      max: 100,
      currency: 'USD'
    }
  })

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const updatePriceRange = useCallback((min: number, max: number, currency: string = 'USD') => {
    setFormData(prev => ({
      ...prev,
      priceRange: { min, max, currency }
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      foodDescription: '',
      cuisine: '',
      cookingMethod: '',
      spiceLevel: 'none',
      richness: 'medium',
      occasion: '',
      priceRange: {
        min: 0,
        max: 100,
        currency: 'USD'
      }
    })
  }, [])

  const isValid = formData.foodDescription.trim().length > 0

  return {
    formData,
    updateField,
    updatePriceRange,
    resetForm,
    isValid
  }
}

// Hook for contextual filtering
export function useContextualFilters() {
  const [filters, setFilters] = useState<Omit<ContextualFilter, 'availability'>>({
    occasion: '',
    urgency: 'medium',
    wineType: [],
    priceRange: undefined,
    companions: 1
  })

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const toggleWineType = useCallback((wineType: string) => {
    setFilters(prev => ({
      ...prev,
      wineType: prev.wineType?.includes(wineType as any)
        ? prev.wineType.filter(type => type !== wineType)
        : [...(prev.wineType || []), wineType as any]
    }))
  }, [])

  const setPriceRange = useCallback((min: number, max: number, currency: string = 'USD') => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max, currency }
    }))
  }, [])

  const clearPriceRange = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: undefined
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      occasion: '',
      urgency: 'medium',
      wineType: [],
      priceRange: undefined,
      companions: 1
    })
  }, [])

  return {
    filters,
    updateFilter,
    toggleWineType,
    setPriceRange,
    clearPriceRange,
    resetFilters
  }
}