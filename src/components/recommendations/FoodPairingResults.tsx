// Food Pairing Results Component
// Displays food pairing recommendations with educational explanations

'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { FoodPairingResponse, FoodPairingRecommendation } from '@/lib/services/food-pairing'

interface FoodPairingResultsProps {
  results: FoodPairingResponse
  onSelectWine?: (wineId: string) => void
  className?: string
}

export function FoodPairingResults({ results, onSelectWine, className = '' }: FoodPairingResultsProps) {
  const { pairings, reasoning, confidence, educationalNotes, alternativePairings, servingTips } = results

  if (pairings.length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <Icon name="wine-glass" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pairings Found</h3>
        <p className="text-gray-600">
          We couldn't find suitable wine pairings in your inventory for this dish. 
          Try adjusting your criteria or consider adding wines that would complement this meal.
        </p>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Reasoning */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pairing Recommendations</h3>
          <Badge variant={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'secondary'}>
            {Math.round(confidence * 100)}% Confidence
          </Badge>
        </div>
        <p className="text-gray-700 mb-4">{reasoning}</p>
        
        {educationalNotes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon name="lightbulb" className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Pairing Insights</h4>
                <p className="text-sm text-blue-800">{educationalNotes}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Primary Recommendations */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Top Recommendations</h4>
        {pairings.map((pairing, index) => (
          <PairingCard
            key={pairing.id}
            pairing={pairing}
            rank={index + 1}
            onSelect={onSelectWine}
            isPrimary={true}
          />
        ))}
      </div>

      {/* Alternative Pairings */}
      {alternativePairings && alternativePairings.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Alternative Options</h4>
          {alternativePairings.map((pairing, index) => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              rank={pairings.length + index + 1}
              onSelect={onSelectWine}
              isPrimary={false}
            />
          ))}
        </div>
      )}

      {/* Serving Tips */}
      {servingTips && (
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="chef-hat" className="w-5 h-5 mr-2" />
            Serving Tips
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servingTips.wineTemperature && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Temperature</h5>
                <p className="text-sm text-gray-600">{servingTips.wineTemperature}</p>
              </div>
            )}
            {servingTips.glassware && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Glassware</h5>
                <p className="text-sm text-gray-600">{servingTips.glassware}</p>
              </div>
            )}
            {servingTips.timing && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Timing</h5>
                <p className="text-sm text-gray-600">{servingTips.timing}</p>
              </div>
            )}
            {servingTips.servingOrder && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Service Order</h5>
                <p className="text-sm text-gray-600">{servingTips.servingOrder}</p>
              </div>
            )}
          </div>
          
          {servingTips.preparation && servingTips.preparation.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Preparation Tips</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {servingTips.preparation.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <Icon name="check" className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

interface PairingCardProps {
  pairing: FoodPairingRecommendation
  rank: number
  onSelect?: (wineId: string) => void
  isPrimary: boolean
}

function PairingCard({ pairing, rank, onSelect, isPrimary }: PairingCardProps) {
  const getPairingTypeColor = (type: string) => {
    const colors = {
      classic: 'bg-blue-100 text-blue-800',
      regional: 'bg-green-100 text-green-800',
      complementary: 'bg-purple-100 text-purple-800',
      contrasting: 'bg-orange-100 text-orange-800',
      adventurous: 'bg-red-100 text-red-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 0.8) return 'star'
    if (confidence > 0.6) return 'check-circle'
    return 'help-circle'
  }

  return (
    <Card className={`p-6 ${isPrimary ? 'border-wine-200 bg-wine-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            isPrimary ? 'bg-wine-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {rank}
          </div>
          <div>
            <h5 className="font-medium text-gray-900">
              {pairing.wineId ? 'From Your Inventory' : 'Purchase Recommendation'}
            </h5>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getPairingTypeColor(pairing.pairingType)}>
                {pairing.pairingType.charAt(0).toUpperCase() + pairing.pairingType.slice(1)} Pairing
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Icon name={getConfidenceIcon(pairing.confidence)} className="w-4 h-4 mr-1" />
                {Math.round(pairing.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        {pairing.wineId && onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(pairing.wineId!)}
          >
            View Wine
          </Button>
        )}
      </div>

      {/* Wine Information */}
      {pairing.suggestedWine && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h6 className="font-medium text-gray-900 mb-2">
            {pairing.suggestedWine.name}
          </h6>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Producer:</span> {pairing.suggestedWine.producer}
            </div>
            <div>
              <span className="font-medium">Region:</span> {pairing.suggestedWine.region}
            </div>
            <div>
              <span className="font-medium">Type:</span> {pairing.suggestedWine.type}
            </div>
            <div>
              <span className="font-medium">Varietal:</span> {pairing.suggestedWine.varietal.join(', ')}
            </div>
          </div>
          {pairing.suggestedWine.estimatedPrice && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Estimated Price:</span> 
              {pairing.suggestedWine.estimatedPrice.min}-{pairing.suggestedWine.estimatedPrice.max} {pairing.suggestedWine.estimatedPrice.currency}
            </div>
          )}
        </div>
      )}

      {/* Pairing Explanation */}
      <div className="mb-4">
        <h6 className="text-sm font-medium text-gray-700 mb-2">Why This Pairing Works</h6>
        <p className="text-sm text-gray-600">{pairing.pairingExplanation}</p>
      </div>

      {/* Educational Context */}
      {pairing.educationalContext && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h6 className="text-sm font-medium text-blue-900 mb-1">Learn More</h6>
          <p className="text-sm text-blue-800">{pairing.educationalContext}</p>
        </div>
      )}

      {/* Serving Recommendations */}
      {pairing.servingRecommendations && (
        <div className="border-t pt-4">
          <h6 className="text-sm font-medium text-gray-700 mb-2">Serving Recommendations</h6>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Temperature:</span> 
              {pairing.servingRecommendations.temperature.celsius}°C ({pairing.servingRecommendations.temperature.fahrenheit}°F)
            </div>
            <div>
              <span className="font-medium">Glass:</span> {pairing.servingRecommendations.glassType}
            </div>
            {pairing.servingRecommendations.decantingTime && (
              <div>
                <span className="font-medium">Decanting:</span> {pairing.servingRecommendations.decantingTime} minutes
              </div>
            )}
            <div>
              <span className="font-medium">Serving Size:</span> {pairing.servingRecommendations.servingSize}
            </div>
          </div>
        </div>
      )}

      {/* Pairing Notes */}
      {pairing.pairingExplanation && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h6 className="text-sm font-medium text-green-900 mb-1">Pairing Notes</h6>
          <p className="text-sm text-green-800">{pairing.pairingExplanation}</p>
        </div>
      )}
    </Card>
  )
}