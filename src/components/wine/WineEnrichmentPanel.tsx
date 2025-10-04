/**
 * Wine Enrichment Panel Component
 * 
 * Provides UI for managing wine data enrichment with external sources
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Wine } from '@/types'
import { useWineEnrichment, EnrichmentSuggestions, EnrichmentStats } from '@/hooks/useWineEnrichment'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'

// ============================================================================
// Types
// ============================================================================

interface WineEnrichmentPanelProps {
  wine: Wine
  onWineUpdated?: (wine: Wine) => void
}

interface EnrichmentStatsDisplayProps {
  stats: EnrichmentStats
  onRefresh: () => void
}

interface EnrichmentSuggestionsDisplayProps {
  suggestions: EnrichmentSuggestions
  onEnrich: () => void
  loading: boolean
}

// ============================================================================
// Enrichment Stats Display Component
// ============================================================================

const EnrichmentStatsDisplay: React.FC<EnrichmentStatsDisplayProps> = ({
  stats,
  onRefresh
}) => {
  const enrichmentPercentage = Math.round(stats.enrichmentRate * 100)
  const confidencePercentage = Math.round(stats.averageConfidence * 100)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Collection Enrichment</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
        >
          <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {enrichmentPercentage}%
          </div>
          <div className="text-sm text-gray-600">
            Enriched ({stats.enrichedWines}/{stats.totalWines})
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {confidencePercentage}%
          </div>
          <div className="text-sm text-gray-600">
            Avg. Confidence
          </div>
        </div>
      </div>

      {stats.lastEnrichment && (
        <div className="text-sm text-gray-600 text-center">
          Last enriched: {stats.lastEnrichment.toLocaleDateString()}
        </div>
      )}

      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${enrichmentPercentage}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// Enrichment Suggestions Display Component
// ============================================================================

const EnrichmentSuggestionsDisplay: React.FC<EnrichmentSuggestionsDisplayProps> = ({
  suggestions,
  onEnrich,
  loading
}) => {
  const confidencePercentage = Math.round(suggestions.confidence * 100)
  const confidenceColor = suggestions.confidence > 0.8 ? 'text-green-600' : 
                         suggestions.confidence > 0.5 ? 'text-yellow-600' : 'text-red-600'

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Data Quality</h3>
        <div className={`text-sm font-medium ${confidenceColor}`}>
          {confidencePercentage}% Complete
        </div>
      </div>

      {suggestions.missingData.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Data:</h4>
          <ul className="space-y-1">
            {suggestions.missingData.map((item, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <Icon name="alert-circle" className="w-4 h-4 mr-2 text-yellow-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Improvements:</h4>
          <ul className="space-y-1">
            {suggestions.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <Icon name="lightbulb" className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        onClick={onEnrich}
        disabled={loading || suggestions.confidence > 0.9}
        className="w-full"
      >
        {loading ? (
          <>
            <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
            Enriching...
          </>
        ) : suggestions.confidence > 0.9 ? (
          <>
            <Icon name="check" className="w-4 h-4 mr-2" />
            Data Complete
          </>
        ) : (
          <>
            <Icon name="arrow-down-tray" className="w-4 h-4 mr-2" />
            Enrich Data
          </>
        )}
      </Button>
    </Card>
  )
}

// ============================================================================
// Main Wine Enrichment Panel Component
// ============================================================================

export const WineEnrichmentPanel: React.FC<WineEnrichmentPanelProps> = ({
  wine,
  onWineUpdated
}) => {
  const {
    loading,
    error,
    enrichWine,
    getEnrichmentSuggestions,
    getEnrichmentStats,
    clearError
  } = useWineEnrichment()

  const [suggestions, setSuggestions] = useState<EnrichmentSuggestions | null>(null)
  const [stats, setStats] = useState<EnrichmentStats | null>(null)
  const [activeTab, setActiveTab] = useState<'wine' | 'collection'>('wine')

  // Load initial data
  useEffect(() => {
    loadSuggestions()
    loadStats()
  }, [wine.id])

  // Clear error when component unmounts or wine changes
  useEffect(() => {
    return () => clearError()
  }, [wine.id, clearError])

  const loadSuggestions = async () => {
    const result = await getEnrichmentSuggestions(wine.id)
    if (result) {
      setSuggestions(result)
    }
  }

  const loadStats = async () => {
    const result = await getEnrichmentStats()
    if (result) {
      setStats(result)
    }
  }

  const handleEnrichWine = async () => {
    const result = await enrichWine(wine.id, { forceRefresh: true })
    if (result && result.success && result.wine) {
      onWineUpdated?.(result.wine)
      await loadSuggestions() // Refresh suggestions
      await loadStats() // Refresh stats
    }
  }

  const handleRefreshStats = async () => {
    await loadStats()
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('wine')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'wine'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          This Wine
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'collection'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Collection
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center">
            <Icon name="alert-circle" className="w-5 h-5 text-red-500 mr-2" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Content */}
      {activeTab === 'wine' && suggestions && (
        <EnrichmentSuggestionsDisplay
          suggestions={suggestions}
          onEnrich={handleEnrichWine}
          loading={loading}
        />
      )}

      {activeTab === 'collection' && stats && (
        <EnrichmentStatsDisplay
          stats={stats}
          onRefresh={handleRefreshStats}
        />
      )}

      {/* Wine External Data Display */}
      {(wine as any).external_data && Object.keys((wine as any).external_data).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">External Data</h3>
          
          {/* Professional Ratings */}
          {(wine as any).external_data.professionalRatings && (wine as any).external_data.professionalRatings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Ratings</h4>
              <div className="space-y-2">
                {(wine as any).external_data.professionalRatings.map((rating: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{rating.source}</div>
                      {rating.reviewer && (
                        <div className="text-xs text-gray-600">{rating.reviewer}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {rating.score}/{rating.maxScore}
                      </div>
                      {rating.reviewDate && (
                        <div className="text-xs text-gray-600">
                          {new Date(rating.reviewDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasting Notes */}
          {(wine as any).external_data.tastingNotes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tasting Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {(wine as any).external_data.tastingNotes}
              </p>
            </div>
          )}

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(wine as any).external_data.alcoholContent && (
              <div>
                <span className="font-medium text-gray-700">Alcohol:</span>
                <span className="ml-2 text-gray-600">{(wine as any).external_data.alcoholContent}%</span>
              </div>
            )}
            
            {(wine as any).external_data.servingTemperature && (
              <div>
                <span className="font-medium text-gray-700">Serving Temp:</span>
                <span className="ml-2 text-gray-600">
                  {(wine as any).external_data.servingTemperature.min}-{(wine as any).external_data.servingTemperature.max}°C
                </span>
              </div>
            )}
            
            {(wine as any).external_data.decantingTime && (
              <div>
                <span className="font-medium text-gray-700">Decanting:</span>
                <span className="ml-2 text-gray-600">{(wine as any).external_data.decantingTime} min</span>
              </div>
            )}
            
            {(wine as any).external_data.agingPotential && (
              <div>
                <span className="font-medium text-gray-700">Aging Potential:</span>
                <span className="ml-2 text-gray-600">{(wine as any).external_data.agingPotential} years</span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {(wine as any).external_data.lastUpdated && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Last updated: {new Date((wine as any).external_data.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default WineEnrichmentPanel