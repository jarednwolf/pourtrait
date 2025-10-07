// Food Pairing Page Component
// Main interface for food pairing and contextual recommendations

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { FoodPairingForm } from './FoodPairingForm'
import { FoodPairingResults } from './FoodPairingResults'
import { ContextualFilters } from './ContextualFilters'
import { useFoodPairing } from '@/hooks/useFoodPairing'
import { useAuth } from '@/hooks/useAuth'

type ViewMode = 'food-pairing' | 'contextual-filters'

export function FoodPairingPage() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('food-pairing')
  const {
    pairings,
    contextualRecommendations,
    loading,
    error,
    generateFoodPairings,
    generateContextualRecommendations,
    clearPairings,
    clearError
  } = useFoodPairing(user?.id || '')

  const handleFoodPairingSubmit = async (formData: any) => {
    clearError()
    await generateFoodPairings(formData)
  }

  const handleContextualFilters = async (filters: any) => {
    clearError()
    await generateContextualRecommendations(filters)
  }

  const handleSelectWine = (wineId: string) => {
    // Navigate to wine detail page or open wine modal
    console.log('Selected wine:', wineId)
    // This would typically navigate to /inventory/wine/[wineId] or open a modal
  }

  const currentResults = viewMode === 'food-pairing' ? pairings : contextualRecommendations

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Icon name="lock" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600 mb-4">
          Please sign in to access food pairing recommendations and contextual wine filtering.
        </p>
        <Button asChild>
          <a href="/auth/signin" aria-label="Sign in to access food pairing">Sign In</a>
        </Button>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Wine Pairing & Selection
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover perfect wine pairings for your meals or filter your inventory 
          based on occasion, price, and preferences with expert guidance.
        </p>
      </div>

      {/* Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              setViewMode('food-pairing')
              clearPairings()
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'food-pairing'
                ? 'bg-wine-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon name="utensils" className="w-5 h-5" />
            <span>Food Pairing</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode('contextual-filters')
              clearPairings()
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'contextual-filters'
                ? 'bg-wine-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon name="filter" className="w-5 h-5" />
            <span>Filter Inventory</span>
          </button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start">
            <Icon name="alert-circle" className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-700 ml-3"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          {viewMode === 'food-pairing' ? (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Find Food Pairings
                </h2>
                <p className="text-gray-600">
                  Describe your meal and we'll recommend wines from your inventory 
                  that create perfect flavor harmonies.
                </p>
              </div>
              <FoodPairingForm
                onSubmit={handleFoodPairingSubmit}
                loading={loading}
              />
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Filter Your Collection
                </h2>
                <p className="text-gray-600">
                  Use multiple criteria to find the perfect wine for any occasion 
                  from your existing inventory.
                </p>
              </div>
              <ContextualFilters
                onApplyFilters={handleContextualFilters}
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          {currentResults ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewMode === 'food-pairing' ? 'Pairing Recommendations' : 'Filtered Results'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPairings}
                >
                  Clear Results
                </Button>
              </div>
              <FoodPairingResults
                results={currentResults}
                onSelectWine={handleSelectWine}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="mb-4">
                {viewMode === 'food-pairing' ? (
                  <Icon name="utensils" className="w-16 h-16 text-gray-300 mx-auto" />
                ) : (
                  <Icon name="wine-glass" className="w-16 h-16 text-gray-300 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {viewMode === 'food-pairing' 
                  ? 'Ready to Find Perfect Pairings' 
                  : 'Ready to Filter Your Collection'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {viewMode === 'food-pairing'
                  ? 'Fill out the form to get personalized wine pairing recommendations based on your meal and preferences.'
                  : 'Set your criteria to discover wines in your inventory that match your current needs and occasion.'
                }
              </p>
              
              {/* Quick Tips */}
              <div className="text-left max-w-md mx-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {viewMode === 'food-pairing' ? 'Pairing Tips:' : 'Filter Tips:'}
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  {viewMode === 'food-pairing' ? (
                    <>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Be specific about your dish and cooking method
                      </li>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Include spice level and richness for better matches
                      </li>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Consider the occasion and dining companions
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Set drinking window priority for optimal timing
                      </li>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Filter by wine type for specific preferences
                      </li>
                      <li className="flex items-start">
                        <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        Use price range to match your budget
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Educational Section */}
      <Card className="p-6 bg-gradient-to-r from-wine-50 to-purple-50 border-wine-200">
        <div className="flex items-start">
          <Icon name="lightbulb" className="w-6 h-6 text-wine-600 mt-1 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Understanding Wine Pairing Principles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">Complementary Pairings</h4>
                <p>
                  Match wine intensity with food intensity. Light wines with delicate dishes, 
                  bold wines with rich, flavorful foods. The wine should enhance, not overpower.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Contrasting Pairings</h4>
                <p>
                  Create balance through contrast. Sweet wines with spicy food, acidic wines 
                  with fatty dishes, or crisp wines with creamy textures.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Regional Harmony</h4>
                <p>
                  Wines and foods from the same region often pair naturally, having evolved 
                  together over centuries. Think Chianti with Italian cuisine.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Seasonal Considerations</h4>
                <p>
                  Consider the season and occasion. Light, crisp wines for summer and seafood, 
                  rich, warming wines for winter and hearty dishes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}