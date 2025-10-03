// Food Pairing Form Component
// Interactive form for food pairing recommendations

'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useFoodPairingForm } from '@/hooks/useFoodPairing'

interface FoodPairingFormProps {
  onSubmit: (formData: any) => void
  loading?: boolean
  className?: string
}

export function FoodPairingForm({ onSubmit, loading = false, className = '' }: FoodPairingFormProps) {
  const { formData, updateField, updatePriceRange, resetForm, isValid } = useFoodPairingForm()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onSubmit({
        foodDescription: formData.foodDescription,
        cuisine: formData.cuisine || undefined,
        cookingMethod: formData.cookingMethod || undefined,
        spiceLevel: formData.spiceLevel,
        richness: formData.richness,
        context: {
          occasion: formData.occasion || undefined,
          priceRange: formData.priceRange.min > 0 || formData.priceRange.max < 1000 
            ? formData.priceRange 
            : undefined
        }
      })
    }
  }

  const cuisineOptions = [
    { value: '', label: 'Any Cuisine' },
    { value: 'italian', label: 'Italian' },
    { value: 'french', label: 'French' },
    { value: 'asian', label: 'Asian' },
    { value: 'indian', label: 'Indian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'american', label: 'American' },
    { value: 'mediterranean', label: 'Mediterranean' }
  ]

  const cookingMethods = [
    { value: '', label: 'Any Method' },
    { value: 'grilled', label: 'Grilled' },
    { value: 'roasted', label: 'Roasted' },
    { value: 'fried', label: 'Fried' },
    { value: 'steamed', label: 'Steamed' },
    { value: 'braised', label: 'Braised' },
    { value: 'raw', label: 'Raw/Fresh' }
  ]

  const spiceLevels = [
    { value: 'none', label: 'No Spice' },
    { value: 'mild', label: 'Mild' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' }
  ]

  const richnessLevels = [
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'rich', label: 'Rich' }
  ]

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Find the Perfect Wine Pairing
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Describe your meal and we'll recommend wines from your inventory that pair beautifully.
          </p>
        </div>

        {/* Food Description */}
        <div>
          <label htmlFor="foodDescription" className="block text-sm font-medium text-gray-700 mb-2">
            What are you eating? *
          </label>
          <Input
            id="foodDescription"
            type="text"
            value={formData.foodDescription}
            onChange={(e) => updateField('foodDescription', e.target.value)}
            placeholder="e.g., grilled salmon with lemon, beef stew, pasta carbonara"
            className="w-full"
            required
          />
        </div>

        {/* Cuisine and Cooking Method Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine Type
            </label>
            <select
              id="cuisine"
              value={formData.cuisine}
              onChange={(e) => updateField('cuisine', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-transparent"
            >
              {cuisineOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cookingMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Cooking Method
            </label>
            <select
              id="cookingMethod"
              value={formData.cookingMethod}
              onChange={(e) => updateField('cookingMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-transparent"
            >
              {cookingMethods.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spice Level and Richness Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spice Level
            </label>
            <div className="flex space-x-2">
              {spiceLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateField('spiceLevel', level.value)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    formData.spiceLevel === level.value
                      ? 'bg-wine-600 text-white border-wine-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Richness
            </label>
            <div className="flex space-x-2">
              {richnessLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateField('richness', level.value)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    formData.richness === level.value
                      ? 'bg-wine-600 text-white border-wine-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Context */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Optional Context</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2">
                Occasion
              </label>
              <Input
                id="occasion"
                type="text"
                value={formData.occasion}
                onChange={(e) => updateField('occasion', e.target.value)}
                placeholder="e.g., romantic dinner, celebration"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (${formData.priceRange.currency})
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) => updatePriceRange(
                    parseInt(e.target.value) || 0, 
                    formData.priceRange.max,
                    formData.priceRange.currency
                  )}
                  placeholder="Min"
                  className="w-full"
                  min="0"
                />
                <Input
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) => updatePriceRange(
                    formData.priceRange.min,
                    parseInt(e.target.value) || 1000,
                    formData.priceRange.currency
                  )}
                  placeholder="Max"
                  className="w-full"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={loading}
          >
            Clear Form
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || loading}
            loading={loading}
          >
            {loading ? 'Finding Pairings...' : 'Find Wine Pairings'}
          </Button>
        </div>
      </form>
    </Card>
  )
}