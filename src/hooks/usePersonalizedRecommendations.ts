// Personalized Recommendations Hook - Client-side interface

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { 
  PersonalizedRecommendationResponse, 
  EnhancedRecommendation,
  RecommendationAnalytics
} from '@/lib/services/personalized-recommendations'
import { RecommendationContext, Recommendation } from '@/types'

// ============================================================================
// Personalized Recommendations Hook
// ============================================================================

interface UsePersonalizedRecommendationsState {
  recommendations: PersonalizedRecommendationResponse | null
  loading: boolean
  error: string | null
}

export function usePersonalizedRecommendations() {
  const { user, getAccessToken } = useAuth()
  const [state, setState] = useState<UsePersonalizedRecommendationsState>({
    recommendations: null,
    loading: false,
    error: null
  })

  const serverEnabled = typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_ENABLE_SERVER_RECS === 'true' : (process.env.NEXT_PUBLIC_ENABLE_SERVER_RECS === 'true')

  /**
   * Get "What to drink tonight" recommendations
   */
  const getTonightRecommendations = useCallback(async (
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendationResponse | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      if (!serverEnabled) {
        // Demo fallback client-side with simple reasoning
        const demo: PersonalizedRecommendationResponse = {
          recommendations: [],
          reasoning: 'Server recommendations disabled. Add wines to your cellar or enable server recs.',
          confidence: 0,
          alternativeOptions: [],
          educationalNotes: undefined,
          followUpQuestions: ['Would you like to ask the AI Sommelier instead?']
        }
        setState(prev => ({ ...prev, recommendations: demo, loading: false }))
        return demo
      }
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'tonight',
          context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get recommendations')
      }

      const data = await response.json()
      const recommendations = data.data

      setState(prev => ({
        ...prev,
        recommendations,
        loading: false
      }))

      return recommendations

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
      return null
    }
  }, [user, getAccessToken])

  /**
   * Get wine purchase recommendations
   */
  const getPurchaseRecommendations = useCallback(async (
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendationResponse | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'purchase',
          context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get recommendations')
      }

      const data = await response.json()
      const recommendations = data.data

      setState(prev => ({
        ...prev,
        recommendations,
        loading: false
      }))

      return recommendations

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
      return null
    }
  }, [user, getAccessToken])

  /**
   * Get contextual recommendations
   */
  const getContextualRecommendations = useCallback(async (
    context: RecommendationContext
  ): Promise<PersonalizedRecommendationResponse | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'contextual',
          context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get recommendations')
      }

      const data = await response.json()
      const recommendations = data.data

      setState(prev => ({
        ...prev,
        recommendations,
        loading: false
      }))

      return recommendations

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
      return null
    }
  }, [user, getAccessToken])

  /**
   * Clear recommendations and reset state
   */
  const clearRecommendations = useCallback(() => {
    setState({
      recommendations: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    getTonightRecommendations,
    getPurchaseRecommendations,
    getContextualRecommendations,
    clearRecommendations,
    isAuthenticated: !!user
  }
}

// ============================================================================
// Recommendation Feedback Hook
// ============================================================================

interface UseRecommendationFeedbackState {
  submitting: boolean
  error: string | null
}

export function useRecommendationFeedback() {
  const { user, getAccessToken } = useAuth()
  const [state, setState] = useState<UseRecommendationFeedbackState>({
    submitting: false,
    error: null
  })

  /**
   * Submit feedback for a recommendation
   */
  const submitFeedback = useCallback(async (
    recommendationId: string,
    feedback: 'accepted' | 'rejected' | 'modified',
    reason?: string,
    modifiedContext?: RecommendationContext
  ): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, submitting: true, error: null }))

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recommendationId,
          feedback,
          reason,
          modifiedContext
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      setState(prev => ({ ...prev, submitting: false }))
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        submitting: false
      }))
      return false
    }
  }, [user, getAccessToken])

  return {
    ...state,
    submitFeedback,
    isAuthenticated: !!user
  }
}

// ============================================================================
// Recommendation History Hook
// ============================================================================

interface UseRecommendationHistoryState {
  history: Recommendation[]
  analytics: RecommendationAnalytics | null
  loading: boolean
  error: string | null
}

export function useRecommendationHistory() {
  const { user, getAccessToken } = useAuth()
  const [state, setState] = useState<UseRecommendationHistoryState>({
    history: [],
    analytics: null,
    loading: false,
    error: null
  })

  /**
   * Fetch recommendation history
   */
  const fetchHistory = useCallback(async (
    limit: number = 50,
    type?: 'inventory' | 'purchase' | 'pairing'
  ): Promise<Recommendation[]> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return []
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const params = new URLSearchParams({
        limit: limit.toString()
      })
      if (type) {
        params.append('type', type)
      }

      const response = await fetch(`/api/recommendations/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch history')
      }

      const data = await response.json()
      const history = data.data

      setState(prev => ({
        ...prev,
        history,
        loading: false
      }))

      return history

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
      return []
    }
  }, [user, getAccessToken])

  /**
   * Fetch recommendation analytics
   */
  const fetchAnalytics = useCallback(async (): Promise<RecommendationAnalytics | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/recommendations/feedback?analytics=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch analytics')
      }

      const data = await response.json()
      const analytics = data.data

      setState(prev => ({
        ...prev,
        analytics,
        loading: false
      }))

      return analytics

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))
      return null
    }
  }, [user, getAccessToken])

  return {
    ...state,
    fetchHistory,
    fetchAnalytics,
    isAuthenticated: !!user
  }
}