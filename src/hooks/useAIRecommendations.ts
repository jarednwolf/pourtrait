// AI Recommendations Hook - Client-side interface

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { AIRecommendationResponse } from '@/lib/ai/types'
import { RecommendationContext } from '@/types'

// ============================================================================
// AI Recommendations Hook
// ============================================================================

interface UseAIRecommendationsOptions {
  includeInventory?: boolean
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
}

interface AIRecommendationState {
  recommendations: AIRecommendationResponse | null
  loading: boolean
  error: string | null
}

export function useAIRecommendations(options: UseAIRecommendationsOptions = {}) {
  const { user, getAccessToken } = useAuth()
  const [state, setState] = useState<AIRecommendationState>({
    recommendations: null,
    loading: false,
    error: null
  })

  /**
   * Get AI wine recommendations
   */
  const getRecommendations = useCallback(async (
    query: string,
    context: RecommendationContext = {}
  ): Promise<AIRecommendationResponse | null> => {
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

      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          context,
          includeInventory: options.includeInventory,
          experienceLevel: options.experienceLevel
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
  }, [user, getAccessToken, options.includeInventory, options.experienceLevel])

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

  /**
   * Retry last recommendation request
   */
  const retry = useCallback(async () => {
    if (state.recommendations) {
      // This would require storing the last query/context, simplified for now
      setState(prev => ({ ...prev, error: null }))
    }
  }, [state.recommendations])

  return {
    ...state,
    getRecommendations,
    clearRecommendations,
    retry,
    isAuthenticated: !!user
  }
}

// ============================================================================
// AI Chat Hook
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
}

interface UseAIChatOptions {
  maxMessages?: number
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { user, getAccessToken } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string>(
    `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  )

  const maxMessages = options.maxMessages || 50

  /**
   * Send a message to the AI sommelier
   */
  const sendMessage = useCallback(async (message: string, context?: Record<string, any>): Promise<void> => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!message.trim()) {
      setError('Message cannot be empty')
      return
    }

    setLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev.slice(-(maxMessages - 2)), userMessage])

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      // Get conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory,
          conversationId: currentConversationId,
          context: context || {}
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      const aiResponse = data.data

      // Add AI response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        confidence: aiResponse.confidence
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        confidence: 0
      }
      
      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setLoading(false)
    }
  }, [user, getAccessToken, messages, maxMessages, currentConversationId])

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  /**
   * Remove a specific message
   */
  const removeMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Submit feedback for a message
   */
  const submitFeedback = useCallback(async (messageId: string, feedback: 'helpful' | 'not_helpful' | 'inappropriate' | 'inaccurate', details?: string) => {
    if (!user) return

    try {
      const token = await getAccessToken()
      if (!token) return

      await fetch('/api/ai/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          feedback,
          details
        })
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }, [user, getAccessToken])

  /**
   * Start a new conversation
   */
  const startNewConversation = useCallback(() => {
    const newConversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setCurrentConversationId(newConversationId)
    setMessages([])
    setError(null)
    return newConversationId
  }, [])

  /**
   * Get conversation context for better recommendations
   */
  const getConversationContext = useCallback(() => {
    const recentMessages = messages.slice(-10)
    const topics = new Set<string>()
    
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase()
        if (content.includes('red wine') || content.includes('cabernet') || content.includes('merlot')) {
          topics.add('red_wine')
        }
        if (content.includes('white wine') || content.includes('chardonnay') || content.includes('sauvignon')) {
          topics.add('white_wine')
        }
        if (content.includes('dinner') || content.includes('meal') || content.includes('food')) {
          topics.add('food_pairing')
        }
        if (content.includes('budget') || content.includes('cheap') || content.includes('expensive')) {
          topics.add('price_sensitive')
        }
      }
    })

    return {
      topics: Array.from(topics),
      messageCount: messages.length,
      conversationId: currentConversationId,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    }
  }, [messages, currentConversationId])

  return {
    messages,
    loading,
    error,
    conversationId: currentConversationId,
    sendMessage,
    submitFeedback,
    clearChat,
    removeMessage,
    startNewConversation,
    getConversationContext,
    isAuthenticated: !!user
  }
}

// ============================================================================
// AI Metrics Hook
// ============================================================================

interface AIMetrics {
  averageResponseTime: number
  averageConfidence: number
  totalInteractions: number
  successRate: number
  totalCost: number
}

export function useAIMetrics() {
  const { user, getAccessToken } = useAuth()
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch AI usage metrics
   */
  const fetchMetrics = useCallback(async (timeframe: '1h' | '24h' | '7d' | '30d' = '24h') => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch(`/api/ai/metrics?timeframe=${timeframe}&userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch metrics')
      }

      const data = await response.json()
      setMetrics(data.data.metrics)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, getAccessToken])

  /**
   * Log a custom metric
   */
  const logMetric = useCallback(async (
    metricType: string,
    metricValue?: number,
    metadata?: Record<string, any>
  ) => {
    if (!user) return

    try {
      const token = await getAccessToken()
      if (!token) return

      await fetch('/api/ai/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          metricType,
          metricValue,
          metadata
        })
      })
    } catch (error) {
      console.error('Failed to log metric:', error)
    }
  }, [user, getAccessToken])

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    logMetric
  }
}