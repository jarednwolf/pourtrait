// Contextual Filters Component
// Multi-parameter filtering interface for wine recommendations

'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useContextualFilters } from '@/hooks/useFoodPairing'

interface ContextualFiltersProps {
  onApplyFilters: (filters: any) => void
  loading?: boolean
  className?: string
}

export function ContextualFilters({ onApplyFilters, loading = false, className = '' }: ContextualFiltersProps) {
  const {
    filters,
    updateFilter,
    toggleWineType,
    setPriceRange,
    clearPriceRange,
    resetFilters
  } = useContextualFilters()

  const handleApplyFilters = () => {
    onApplyFilters(filters)
  }

  const wineTypes = [
    { value: 'red', label: 'Red', icon: 'wine-glass' },
    { value: 'white', label: 'White', icon: 'wine-glass' },
    { value: 'rosé', label: 'Rosé', icon: 'wine-glass' },
    { value: 'sparkling', label: 'Sparkling', icon: 'sparkles' },
    { value: 'dessert', label: 'Dessert', icon: 'cake' },
    { value: 'fortified', label: 'Fortified', icon: 'shield' }
  ]

  const occasions = [
    'Casual dinner',
    'Romantic dinner',
    'Business dinner',
    'Celebration',
    'Holiday meal',
    'Weekend lunch',
    'Cocktail party',
    'Wine tasting'
  ]

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'Wines that can age longer' },
    { value: 'medium', label: 'Medium', description: 'Ready to drink wines' },
    { value: 'high', label: 'High', description: 'Wines at peak or declining' }
  ]

  const hasActiveFilters = 
    filters.occasion || 
    filters.urgency !== 'medium' || 
    (filters.wineType && filters.wineType.length > 0) ||
    filters.priceRange ||
    (filters.companions && filters.companions > 1)

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filter Your Wine Selection</h3>
          <p className="text-sm text-gray-600 mt-1">
            Narrow down your inventory based on occasion, price, and preferences
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={loading}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Occasion
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {occasions.map(occasion => (
              <button
                key={occasion}
                type="button"
                onClick={() => updateFilter('occasion', filters.occasion === occasion ? '' : occasion)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${
                  filters.occasion === occasion
                    ? 'bg-wine-600 text-white border-wine-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </div>

        {/* Wine Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Wine Types
            {filters.wineType && filters.wineType.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({filters.wineType.length} selected)
              </span>
            )}
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {wineTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleWineType(type.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-center space-x-1 ${
                  filters.wineType?.includes(type.value as any)
                    ? 'bg-wine-600 text-white border-wine-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon name={type.icon as any} className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Drinking Window Priority
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgencyLevels.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => updateFilter('urgency', level.value)}
                className={`p-3 text-left rounded-md border transition-colors ${
                  filters.urgency === level.value
                    ? 'bg-wine-600 text-white border-wine-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{level.label} Priority</div>
                <div className={`text-sm ${
                  filters.urgency === level.value ? 'text-wine-100' : 'text-gray-500'
                }`}>
                  {level.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Price Range (USD)
            </label>
            {filters.priceRange && (
              <button
                type="button"
                onClick={clearPriceRange}
                className="text-sm text-wine-600 hover:text-wine-700"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex space-x-3 items-center">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Min price"
                value={filters.priceRange?.min || ''}
                onChange={(e) => {
                  const min = parseInt(e.target.value) || 0
                  setPriceRange(min, filters.priceRange?.max || 1000)
                }}
                min="0"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Max price"
                value={filters.priceRange?.max || ''}
                onChange={(e) => {
                  const max = parseInt(e.target.value) || 1000
                  setPriceRange(filters.priceRange?.min || 0, max)
                }}
                min="0"
              />
            </div>
          </div>
          
          {filters.priceRange && (
            <div className="mt-2">
              <Badge variant="secondary">
                ${filters.priceRange.min} - ${filters.priceRange.max}
              </Badge>
            </div>
          )}
        </div>

        {/* Number of People */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of People
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => updateFilter('companions', Math.max(1, (filters.companions || 1) - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              disabled={filters.companions === 1}
            >
              <Icon name="minus" className="w-4 h-4" />
            </button>
            
            <span className="text-lg font-medium min-w-[2rem] text-center">
              {filters.companions || 1}
            </span>
            
            <button
              type="button"
              onClick={() => updateFilter('companions', (filters.companions || 1) + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              <Icon name="plus" className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-500 ml-2">
              {filters.companions === 1 ? 'person' : 'people'}
            </span>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {filters.occasion && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>{filters.occasion}</span>
                  <button
                    onClick={() => updateFilter('occasion', '')}
                    className="ml-1 hover:text-gray-700"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.wineType && filters.wineType.map(type => (
                <Badge key={type} variant="secondary" className="flex items-center space-x-1">
                  <span>{type}</span>
                  <button
                    onClick={() => toggleWineType(type)}
                    className="ml-1 hover:text-gray-700"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.urgency !== 'medium' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>{filters.urgency} priority</span>
                  <button
                    onClick={() => updateFilter('urgency', 'medium')}
                    className="ml-1 hover:text-gray-700"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.priceRange && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>${filters.priceRange.min}-${filters.priceRange.max}</span>
                  <button
                    onClick={clearPriceRange}
                    className="ml-1 hover:text-gray-700"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.companions && filters.companions > 1 && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>{filters.companions} people</span>
                  <button
                    onClick={() => updateFilter('companions', 1)}
                    className="ml-1 hover:text-gray-700"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleApplyFilters}
            disabled={loading}
            loading={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Filtering...' : 'Apply Filters'}
          </Button>
        </div>
      </div>
    </Card>
  )
}