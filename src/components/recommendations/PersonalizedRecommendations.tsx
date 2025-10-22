// Personalized Recommendations Components

'use client'

import React, { useState, useEffect } from 'react'
import { usePersonalizedRecommendations, useRecommendationFeedback } from '@/hooks/usePersonalizedRecommendations'
import { EnhancedRecommendation } from '@/lib/services/personalized-recommendations'
import { RecommendationContext } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { WineService } from '@/lib/services/wine-service'

// ============================================================================
// Tonight's Recommendations Component
// ============================================================================

interface TonightRecommendationsProps {
  context?: RecommendationContext
  onRecommendationSelect?: (recommendation: EnhancedRecommendation) => void
}

export function TonightRecommendations({ 
  context, 
  onRecommendationSelect 
}: TonightRecommendationsProps) {
  const { 
    recommendations, 
    loading, 
    error, 
    getTonightRecommendations,
    isAuthenticated 
  } = usePersonalizedRecommendations()

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (isAuthenticated && isInitialLoad) {
      getTonightRecommendations(context)
      setIsInitialLoad(false)
    }
  }, [isAuthenticated, isInitialLoad, getTonightRecommendations, context])

  const handleRefresh = () => {
    getTonightRecommendations(context)
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6 text-center">
        <Icon name="user" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
        <p className="text-gray-600">Please sign in to get personalized wine recommendations.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Recommendations</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </Card>
    )
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card className="p-6 text-center" aria-label="Recommendations empty state">
        <Icon name="wine" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
        <p className="text-gray-600 mb-4">
          {recommendations?.reasoning || "We couldn't find any wines to recommend right now."}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={handleRefresh} variant="outline" aria-label="Refresh recommendations">
            Refresh
          </Button>
          <a
            href="/chat?q=What%20should%20I%20drink%20tonight%3F&send=1"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Ask the Sommelier"
          >
            Ask the Sommelier
          </a>
          {/* CSV import helper link removed */}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">What to Drink Tonight</h2>
          <p className="text-gray-600 mt-1">{recommendations.reasoning}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Recommendations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            isPrimary={index === 0}
            onSelect={() => onRecommendationSelect?.(recommendation)}
          />
        ))}
      </div>

      {/* Educational Notes */}
      {recommendations.educationalNotes && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Icon name="lightbulb" className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Learning Opportunity</h4>
              <p className="text-blue-800 text-sm">{recommendations.educationalNotes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Follow-up Questions */}
      {recommendations.followUpQuestions && recommendations.followUpQuestions.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Want more specific recommendations?</h4>
          <div className="space-y-2">
            {recommendations.followUpQuestions.map((question, index) => (
              <p key={index} className="text-sm text-gray-600">• {question}</p>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Purchase Recommendations Component
// ============================================================================

interface PurchaseRecommendationsProps {
  context?: RecommendationContext
  onRecommendationSelect?: (recommendation: EnhancedRecommendation) => void
}

export function PurchaseRecommendations({ 
  context, 
  onRecommendationSelect 
}: PurchaseRecommendationsProps) {
  const { 
    recommendations, 
    loading, 
    error, 
    getPurchaseRecommendations,
    isAuthenticated 
  } = usePersonalizedRecommendations()

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (isAuthenticated && isInitialLoad) {
      getPurchaseRecommendations(context)
      setIsInitialLoad(false)
    }
  }, [isAuthenticated, isInitialLoad, getPurchaseRecommendations, context])

  const handleRefresh = () => {
    getPurchaseRecommendations(context)
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6 text-center">
        <Icon name="user" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
        <p className="text-gray-600">Please sign in to get personalized wine purchase recommendations.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Recommendations</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </Card>
    )
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Icon name="shopping-cart" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Purchase Recommendations</h3>
        <p className="text-gray-600 mb-4">
          {recommendations?.reasoning || "We couldn't find any wines to recommend for purchase right now."}
        </p>
        <Button onClick={handleRefresh} variant="outline">
          Refresh
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wines to Buy</h2>
          <p className="text-gray-600 mt-1">{recommendations.reasoning}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Recommendations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.recommendations.map((recommendation, index) => (
          <PurchaseRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            isPrimary={index === 0}
            onSelect={() => onRecommendationSelect?.(recommendation)}
          />
        ))}
      </div>

      {/* Educational Notes */}
      {recommendations.educationalNotes && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <Icon name="lightbulb" className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Expand Your Collection</h4>
              <p className="text-green-800 text-sm">{recommendations.educationalNotes}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Recommendation Card Component
// ============================================================================

interface RecommendationCardProps {
  recommendation: EnhancedRecommendation
  isPrimary?: boolean
  onSelect?: () => void
}

function RecommendationCard({ 
  recommendation, 
  isPrimary = false, 
  onSelect 
}: RecommendationCardProps) {
  const { submitFeedback } = useRecommendationFeedback()
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [showRatePrompt, setShowRatePrompt] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [rateSubmitting, setRateSubmitting] = useState(false)
  const [rateSuccess, setRateSuccess] = useState(false)

  const handleFeedback = async (feedback: 'accepted' | 'rejected') => {
    const success = await submitFeedback(recommendation.id, feedback)
    if (success) {
      setFeedbackSubmitted(true)
      if (feedback === 'accepted' && recommendation.wineId) {
        setShowRatePrompt(true)
      }
    }
  }

  const handleModify = async () => {
    const reason = typeof window !== 'undefined' ? window.prompt('How would you like to adjust this recommendation? (e.g., prefer white under $30, pairing with chicken)') : null
    if (!reason) {return}
    await submitFeedback(recommendation.id, 'modified', reason)
    setFeedbackSubmitted(true)
  }

  const handleLogConsumption = async () => {
    if (rating === null) {return}
    try {
      setRateSubmitting(true)
      if (recommendation.wineId) {
        await WineService.markConsumed(recommendation.wineId, new Date(), rating)
      } else if (recommendation.suggestedWine) {
        const sw = recommendation.suggestedWine
        await WineService.createWineAndMarkConsumed(
          recommendation.userId,
          {
            name: sw.name,
            producer: sw.producer,
            vintage: sw.vintage,
            region: sw.region,
            country: undefined,
            type: sw.type,
          },
          new Date(),
          rating
        )
      }
      setRateSuccess(true)
      setShowRatePrompt(false)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to log consumption', e)
    } finally {
      setRateSubmitting(false)
    }
  }

  return (
    <Card className={`p-4 ${isPrimary ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      {isPrimary && (
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="star" className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Top Recommendation</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Wine Info */}
        <div>
          <h3 className="font-semibold text-lg">Wine from Inventory</h3>
          <p className="text-sm text-gray-600">
            Confidence: {Math.round(recommendation.confidence * 100)}%
          </p>
        </div>

        {/* Reasoning */}
        <p className="text-sm text-gray-700">{recommendation.personalizedReasoning}</p>

        {/* Urgency Score */}
        {recommendation.urgencyScore > 0.7 && (
          <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
            <Icon name="clock" className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              {recommendation.urgencyScore > 0.9 ? 'Urgent - drink soon!' : 'Good time to drink'}
            </span>
          </div>
        )}

        {/* Drinking Window Alert */}
        {recommendation.drinkingWindowAlert && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
            <Icon name="alert-triangle" className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">
              {recommendation.drinkingWindowAlert.message}
            </span>
          </div>
        )}

        {/* Serving Recommendations */}
        {recommendation.servingRecommendations && (
          <div className="text-xs text-gray-600 space-y-1">
            <p>Serve at {recommendation.servingRecommendations.temperature?.celsius}°C</p>
            {recommendation.servingRecommendations.decantingTime && (
              <p>Decant for {recommendation.servingRecommendations.decantingTime} minutes</p>
            )}
          </div>
        )}

        {/* Pairing Notes */}
        {recommendation.pairingNotes && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{recommendation.pairingNotes}</p>
          </div>
        )}

        {/* Learning Opportunity */}
        {recommendation.learningOpportunity && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">{recommendation.learningOpportunity}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            onClick={onSelect} 
            size="sm" 
            className="flex-1"
          >
            Select This Wine
          </Button>
          
          {!feedbackSubmitted && (
            <div className="flex space-x-1">
              <Button
                onClick={() => handleFeedback('accepted')}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Icon name="check-circle" className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFeedback('rejected')}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Icon name="x-circle" className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleModify}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Icon name="edit" className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Inline rating prompt after accept */}
        {showRatePrompt && recommendation.wineId && (
          <div className="mt-3 p-2 border rounded-lg">
            <div className="text-sm font-medium mb-2">Rate this wine (1–10)</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <Button key={n} size="sm" variant={rating === n ? 'primary' : 'outline'} onClick={() => setRating(n)} className="px-2">
                  {n}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleLogConsumption} disabled={rating === null || rateSubmitting}>
                {rateSubmitting ? 'Saving…' : 'Log consumption'}
              </Button>
              {rateSuccess && (
                <span className="text-xs text-green-700 flex items-center"><Icon name="success" className="w-3 h-3 mr-1" /> Saved</span>
              )}
              <a href="/inventory" className="text-xs underline text-gray-600 ml-2">View in cellar</a>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// Purchase Recommendation Card Component
// ============================================================================

function PurchaseRecommendationCard({ 
  recommendation, 
  isPrimary = false, 
  onSelect 
}: RecommendationCardProps) {
  const { submitFeedback } = useRecommendationFeedback()
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const handleFeedback = async (feedback: 'accepted' | 'rejected') => {
    const success = await submitFeedback(recommendation.id, feedback)
    if (success) {
      setFeedbackSubmitted(true)
    }
  }

  const wine = recommendation.suggestedWine

  if (!wine) {return null}

  return (
    <Card className={`p-4 ${isPrimary ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      {isPrimary && (
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="star" className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">Top Pick</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Wine Info */}
        <div>
          <h3 className="font-semibold text-lg">{wine.name}</h3>
          <p className="text-sm text-gray-600">{wine.producer}</p>
          <p className="text-sm text-gray-600">
            {wine.vintage && `${wine.vintage} • `}{wine.region} • {wine.varietal?.join(', ')}
          </p>
        </div>

        {/* Price */}
        {wine.estimatedPrice && (
          <div className="flex items-center space-x-2">
            <Icon name="dollar-sign" className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">
              ${wine.estimatedPrice.min} - ${wine.estimatedPrice.max}
            </span>
          </div>
        )}

        {/* Reasoning */}
        <p className="text-sm text-gray-700">{recommendation.personalizedReasoning}</p>

        {/* Learning Opportunity */}
        {recommendation.learningOpportunity && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">{recommendation.learningOpportunity}</p>
          </div>
        )}

        {/* Availability Info */}
        {wine.availabilityInfo && (
          <p className="text-xs text-gray-600">{wine.availabilityInfo}</p>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            onClick={onSelect} 
            size="sm" 
            className="flex-1"
          >
            Find This Wine
          </Button>
          
          {!feedbackSubmitted && (
            <div className="flex space-x-1">
              <Button
                onClick={() => handleFeedback('accepted')}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Icon name="check-circle" className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleFeedback('rejected')}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Icon name="x-circle" className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}