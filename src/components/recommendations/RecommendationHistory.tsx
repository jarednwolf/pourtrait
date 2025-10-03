// Recommendation History and Analytics Components

'use client'

import React, { useState, useEffect } from 'react'
import { useRecommendationHistory } from '@/hooks/usePersonalizedRecommendations'
import { RecommendationAnalytics } from '@/lib/services/personalized-recommendations'
import { Recommendation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'

// ============================================================================
// Recommendation History Component
// ============================================================================

interface RecommendationHistoryProps {
  limit?: number
  type?: 'inventory' | 'purchase' | 'pairing'
  showAnalytics?: boolean
}

export function RecommendationHistory({ 
  limit = 50, 
  type,
  showAnalytics = true 
}: RecommendationHistoryProps) {
  const { 
    history, 
    analytics, 
    loading, 
    error, 
    fetchHistory, 
    fetchAnalytics,
    isAuthenticated 
  } = useRecommendationHistory()

  const [selectedType, setSelectedType] = useState<'all' | 'inventory' | 'purchase' | 'pairing'>(
    type || 'all'
  )

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(limit, selectedType === 'all' ? undefined : selectedType)
      if (showAnalytics) {
        fetchAnalytics()
      }
    }
  }, [isAuthenticated, limit, selectedType, fetchHistory, fetchAnalytics, showAnalytics])

  const handleTypeChange = (newType: 'all' | 'inventory' | 'purchase' | 'pairing') => {
    setSelectedType(newType)
  }

  const handleRefresh = () => {
    fetchHistory(limit, selectedType === 'all' ? undefined : selectedType)
    if (showAnalytics) {
      fetchAnalytics()
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6 text-center">
        <Icon name="user" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
        <p className="text-gray-600">Please sign in to view your recommendation history.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {showAnalytics && (
          <Card className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading History</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <RecommendationAnalyticsCard analytics={analytics} />
      )}

      {/* History Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recommendation History</h2>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'inventory', 'purchase', 'pairing'] as const).map((filterType) => (
            <Button
              key={filterType}
              onClick={() => handleTypeChange(filterType)}
              variant={selectedType === filterType ? 'default' : 'outline'}
              size="sm"
            >
              {filterType === 'all' ? 'All' : 
               filterType === 'inventory' ? 'Tonight' :
               filterType === 'purchase' ? 'Purchase' : 'Pairing'}
            </Button>
          ))}
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="history" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-gray-600">
              Start getting recommendations to see your history here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((recommendation) => (
              <RecommendationHistoryItem
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// Analytics Card Component
// ============================================================================

interface RecommendationAnalyticsCardProps {
  analytics: RecommendationAnalytics
}

function RecommendationAnalyticsCard({ analytics }: RecommendationAnalyticsCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6">Recommendation Analytics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.totalRecommendations}
          </div>
          <div className="text-sm text-gray-600">Total Recommendations</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(analytics.acceptanceRate * 100)}%
          </div>
          <div className="text-sm text-gray-600">Acceptance Rate</div>
        </div>
        
        <div className="text-2xl font-bold text-purple-600 text-center">
          {Math.round(analytics.averageConfidence * 100)}%
        </div>
        <div className="text-sm text-gray-600 text-center">Avg Confidence</div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {analytics.pendingFeedback}
          </div>
          <div className="text-sm text-gray-600">Pending Feedback</div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Recommendation Types</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{analytics.typeBreakdown.inventory}</div>
            <div className="text-gray-600">Tonight</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{analytics.typeBreakdown.purchase}</div>
            <div className="text-gray-600">Purchase</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{analytics.typeBreakdown.pairing}</div>
            <div className="text-gray-600">Pairing</div>
          </div>
        </div>
      </div>

      {/* Feedback Breakdown */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-3">Feedback Distribution</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Accepted</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${analytics.acceptanceRate * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {Math.round(analytics.acceptanceRate * 100)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rejected</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${analytics.rejectionRate * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {Math.round(analytics.rejectionRate * 100)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Modified</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${analytics.modificationRate * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {Math.round(analytics.modificationRate * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// History Item Component
// ============================================================================

interface RecommendationHistoryItemProps {
  recommendation: Recommendation
}

function RecommendationHistoryItem({ recommendation }: RecommendationHistoryItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory': return 'wine'
      case 'purchase': return 'shopping-cart'
      case 'pairing': return 'utensils'
      default: return 'star'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory': return 'Tonight'
      case 'purchase': return 'Purchase'
      case 'pairing': return 'Pairing'
      default: return type
    }
  }

  const getFeedbackIcon = (feedback?: string) => {
    switch (feedback) {
      case 'accepted': return 'thumbs-up'
      case 'rejected': return 'thumbs-down'
      case 'modified': return 'edit'
      default: return 'clock'
    }
  }

  const getFeedbackColor = (feedback?: string) => {
    switch (feedback) {
      case 'accepted': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      case 'modified': return 'text-yellow-600'
      default: return 'text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon 
            name={getTypeIcon(recommendation.type)} 
            className="w-5 h-5 text-gray-500 mt-0.5" 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {getTypeLabel(recommendation.type)} Recommendation
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(recommendation.createdAt.toString())}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">
              {recommendation.reasoning}
            </p>
            
            {/* Context */}
            {recommendation.context && Object.keys(recommendation.context).length > 0 && (
              <div className="text-xs text-gray-600 mb-2">
                {recommendation.context.occasion && (
                  <span className="mr-3">Occasion: {recommendation.context.occasion}</span>
                )}
                {recommendation.context.foodPairing && (
                  <span className="mr-3">Food: {recommendation.context.foodPairing}</span>
                )}
                {recommendation.context.priceRange && (
                  <span>
                    Budget: ${recommendation.context.priceRange.min}-${recommendation.context.priceRange.max}
                  </span>
                )}
              </div>
            )}
            
            {/* Suggested Wine (for purchase recommendations) */}
            {recommendation.suggestedWine && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-2">
                <strong>{recommendation.suggestedWine.name}</strong>
                {recommendation.suggestedWine.producer && (
                  <span> by {recommendation.suggestedWine.producer}</span>
                )}
                {recommendation.suggestedWine.region && (
                  <span> from {recommendation.suggestedWine.region}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-4">
          {/* Confidence */}
          <div className="text-right">
            <div className="text-sm font-medium">
              {Math.round(recommendation.confidence * 100)}%
            </div>
            <div className="text-xs text-gray-500">confidence</div>
          </div>
          
          {/* Feedback Status */}
          <div className="flex items-center">
            <Icon 
              name={getFeedbackIcon(recommendation.userFeedback)} 
              className={`w-4 h-4 ${getFeedbackColor(recommendation.userFeedback)}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}