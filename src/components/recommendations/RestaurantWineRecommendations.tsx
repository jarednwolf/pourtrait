'use client'

import React, { useState, useCallback } from 'react'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  useRestaurantWineAnalysis,
  RestaurantRecommendation,
  MealContext,
  formatRecommendationScore,
  formatMatchConfidence,
  getTopRecommendations
} from '@/hooks/useRestaurantWineAnalysis'
import { ExtractedWineListItem, RecommendationContext } from '@/types'

interface RestaurantWineRecommendationsProps {
  wines: ExtractedWineListItem[]
  onBack?: () => void
  className?: string
}

interface FilterOptions {
  minScore: number
  wineTypes: string[]
  priceRange: { min: number; max: number } | null
  showOnlyMatched: boolean
}

export function RestaurantWineRecommendations({ 
  wines, 
  onBack, 
  className = '' 
}: RestaurantWineRecommendationsProps) {
  const { 
    isAnalyzing, 
    error, 
    analysisResult, 
    analyzeWineList, 
    clearError 
  } = useRestaurantWineAnalysis()

  const [mealContext, setMealContext] = useState<MealContext>({})
  const [showMealForm, setShowMealForm] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    minScore: 0.3,
    wineTypes: [],
    priceRange: null,
    showOnlyMatched: false
  })
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set())

  // Auto-analyze when component mounts
  React.useEffect(() => {
    if (wines.length > 0 && !analysisResult && !isAnalyzing) {
      handleAnalyze()
    }
  }, [wines])

  const handleAnalyze = useCallback(async () => {
    try {
      const context: RecommendationContext & { meal?: MealContext } = {}
      
      if (Object.keys(mealContext).length > 0) {
        context.meal = mealContext
      }

      await analyzeWineList(wines, context)
    } catch (err) {
      console.error('Analysis failed:', err)
    }
  }, [wines, mealContext, analyzeWineList])

  const handleMealContextSubmit = useCallback(() => {
    setShowMealForm(false)
    handleAnalyze()
  }, [handleAnalyze])

  const toggleRecommendationExpansion = useCallback((index: number) => {
    setExpandedRecommendations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const getFilteredRecommendations = useCallback(() => {
    if (!analysisResult) return []

    let filtered = analysisResult.recommendations.filter(rec => rec.score >= filters.minScore)

    if (filters.showOnlyMatched) {
      filtered = filtered.filter(rec => rec.wine.matchedWine)
    }

    if (filters.wineTypes.length > 0) {
      filtered = filtered.filter(rec => 
        rec.wine.matchedWine && filters.wineTypes.includes(rec.wine.matchedWine.type)
      )
    }

    if (filters.priceRange) {
      filtered = filtered.filter(rec => {
        const priceStr = rec.wine.extractedWine.price
        if (!priceStr) return true
        
        const priceMatch = priceStr.match(/[\d.,]+/)
        if (!priceMatch) return true
        
        const price = parseFloat(priceMatch[0].replace(',', ''))
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max
      })
    }

    return filtered
  }, [analysisResult, filters])

  if (isAnalyzing) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Wine List</h3>
          <p className="text-gray-600">
            Cross-referencing {wines.length} wines with your taste profile and preferences...
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">Analysis Failed</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleAnalyze}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-100"
                  >
                    Back to Scanner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6 text-center">
          <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
          <p className="text-gray-600 mb-4">
            Click below to get personalized recommendations from the restaurant's wine list.
          </p>
          <Button onClick={handleAnalyze}>Analyze Wine List</Button>
        </Card>
      </div>
    )
  }

  const filteredRecommendations = getFilteredRecommendations()
  const topRecommendations = getTopRecommendations(analysisResult, 3)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wine Recommendations</h2>
          <p className="text-gray-600">
            Personalized suggestions from {analysisResult.totalWines} wines
          </p>
        </div>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Back to Scanner
          </Button>
        )}
      </div>

      {/* Analysis Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {analysisResult.recommendations.length}
            </div>
            <div className="text-sm text-blue-700">Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(analysisResult.analysisMetadata.matchingAccuracy * 100)}%
            </div>
            <div className="text-sm text-blue-700">Matching Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(analysisResult.analysisMetadata.recommendationConfidence * 100)}%
            </div>
            <div className="text-sm text-blue-700">Confidence</div>
          </div>
        </div>
      </Card>

      {/* Meal Context */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Meal Context</h3>
          <Button
            onClick={() => setShowMealForm(!showMealForm)}
            variant="outline"
            size="sm"
          >
            {showMealForm ? 'Cancel' : 'Add Meal Info'}
          </Button>
        </div>

        {showMealForm && (
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  value={mealContext.dishName || ''}
                  onChange={(e) => setMealContext(prev => ({ ...prev, dishName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Grilled Salmon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Ingredient
                </label>
                <select
                  value={mealContext.mainIngredient || ''}
                  onChange={(e) => setMealContext(prev => ({ ...prev, mainIngredient: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select ingredient</option>
                  <option value="beef">Beef</option>
                  <option value="lamb">Lamb</option>
                  <option value="pork">Pork</option>
                  <option value="chicken">Chicken</option>
                  <option value="fish">Fish</option>
                  <option value="seafood">Seafood</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="pasta">Pasta</option>
                  <option value="cheese">Cheese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooking Method
                </label>
                <select
                  value={mealContext.cookingMethod || ''}
                  onChange={(e) => setMealContext(prev => ({ ...prev, cookingMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="grilled">Grilled</option>
                  <option value="roasted">Roasted</option>
                  <option value="braised">Braised</option>
                  <option value="fried">Fried</option>
                  <option value="steamed">Steamed</option>
                  <option value="poached">Poached</option>
                  <option value="raw">Raw</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spice Level
                </label>
                <select
                  value={mealContext.spiceLevel || ''}
                  onChange={(e) => setMealContext(prev => ({ ...prev, spiceLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select spice level</option>
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="spicy">Spicy</option>
                </select>
              </div>
            </div>
            <Button onClick={handleMealContextSubmit} className="w-full">
              Update Recommendations
            </Button>
          </div>
        )}

        {Object.keys(mealContext).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mealContext.dishName && (
              <Badge variant="secondary">Dish: {mealContext.dishName}</Badge>
            )}
            {mealContext.mainIngredient && (
              <Badge variant="secondary">Ingredient: {mealContext.mainIngredient}</Badge>
            )}
            {mealContext.cookingMethod && (
              <Badge variant="secondary">Method: {mealContext.cookingMethod}</Badge>
            )}
            {mealContext.spiceLevel && (
              <Badge variant="secondary">Spice: {mealContext.spiceLevel}</Badge>
            )}
          </div>
        )}
      </Card>

      {/* Top Recommendations */}
      {topRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Picks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommendations.map((recommendation, index) => (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                rank={index + 1}
                isTopPick={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">All Recommendations</h3>
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredRecommendations.length} of {analysisResult.recommendations.length}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {filteredRecommendations.map((recommendation, index) => (
            <DetailedRecommendationCard
              key={index}
              recommendation={recommendation}
              rank={index + 1}
              isExpanded={expandedRecommendations.has(index)}
              onToggleExpansion={() => toggleRecommendationExpansion(index)}
            />
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <Card className="p-6 text-center">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or meal context to see more recommendations.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: RestaurantRecommendation
  rank: number
  isTopPick?: boolean
}

function RecommendationCard({ recommendation, rank, isTopPick = false }: RecommendationCardProps) {
  const wine = recommendation.wine.extractedWine

  return (
    <Card className={`p-4 ${isTopPick ? 'border-blue-200 bg-blue-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isTopPick ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {rank}
          </div>
          {isTopPick && <StarIconSolid className="h-4 w-4 text-yellow-500" />}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {formatRecommendationScore(recommendation.score)}
          </div>
          <div className="text-xs text-gray-500">Match Score</div>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-gray-900">{wine.name}</h4>
        {wine.producer && (
          <p className="text-sm text-gray-600">{wine.producer}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="text-sm text-gray-500">
            {wine.vintage && `${wine.vintage} • `}
            {formatMatchConfidence(recommendation.wine.confidence)}
          </div>
          {wine.price && (
            <div className="font-medium text-gray-900">{wine.price}</div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-700">
        {recommendation.explanation}
      </div>

      {recommendation.reasoning.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {recommendation.reasoning.slice(0, 2).map((reason, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

interface DetailedRecommendationCardProps {
  recommendation: RestaurantRecommendation
  rank: number
  isExpanded: boolean
  onToggleExpansion: () => void
}

function DetailedRecommendationCard({ 
  recommendation, 
  rank, 
  isExpanded, 
  onToggleExpansion 
}: DetailedRecommendationCardProps) {
  const wine = recommendation.wine.extractedWine

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
            {rank}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{wine.name}</h4>
            {wine.producer && (
              <p className="text-sm text-gray-600">{wine.producer}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatRecommendationScore(recommendation.score)}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          <Button
            onClick={onToggleExpansion}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-500">Match: </span>
          <span className="font-medium">{formatMatchConfidence(recommendation.wine.confidence)}</span>
        </div>
        {wine.price && (
          <div>
            <span className="text-gray-500">Price: </span>
            <span className="font-medium">{wine.price}</span>
          </div>
        )}
        {wine.vintage && (
          <div>
            <span className="text-gray-500">Vintage: </span>
            <span className="font-medium">{wine.vintage}</span>
          </div>
        )}
        {recommendation.wine.matchedWine && (
          <div>
            <span className="text-gray-500">Type: </span>
            <span className="font-medium capitalize">{recommendation.wine.matchedWine.type}</span>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-700 mb-3">
        {recommendation.explanation}
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {/* Detailed Scores */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {recommendation.tasteProfileScore !== undefined && (
              <div>
                <span className="text-gray-500">Taste Match: </span>
                <span className="font-medium">
                  {formatRecommendationScore(recommendation.tasteProfileScore)}
                </span>
              </div>
            )}
            {recommendation.foodPairingScore !== undefined && (
              <div>
                <span className="text-gray-500">Food Pairing: </span>
                <span className="font-medium">
                  {formatRecommendationScore(recommendation.foodPairingScore)}
                </span>
              </div>
            )}
          </div>

          {/* Reasoning */}
          {recommendation.reasoning.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Why this wine:</h5>
              <div className="flex flex-wrap gap-1">
                {recommendation.reasoning.map((reason, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Match Details */}
          {recommendation.wine.matchedFields.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Matched fields:</h5>
              <div className="flex flex-wrap gap-1">
                {recommendation.wine.matchedFields.map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}