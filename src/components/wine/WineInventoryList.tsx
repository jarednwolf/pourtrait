'use client'

import React, { useState, useEffect } from 'react'
import { WineCard } from './WineCard'
import { WineSearchInterface } from './WineSearchInterface'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Wine } from '@/types'
import type { InventoryFilters } from '@/types'

interface WineInventoryListProps {
  wines?: Wine[] // Made optional since we now use search
  onWineView?: (wine: Wine) => void
  onWineEdit?: (wine: Wine) => void
  onWineConsume?: (wine: Wine) => void
  onWineDelete?: (wine: Wine) => void
  onFiltersChange?: (filters: InventoryFilters) => void
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  useSearch?: boolean // New prop to enable search interface
}

const WINE_TYPES = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortified' }
]

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'producer', label: 'Producer' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'rating', label: 'Rating' },
  { value: 'purchaseDate', label: 'Purchase Date' }
]

const DRINKING_WINDOW_STATUS = [
  { value: 'too_young', label: 'Too Young' },
  { value: 'ready', label: 'Ready' },
  { value: 'peak', label: 'Peak' },
  { value: 'declining', label: 'Declining' },
  { value: 'over_hill', label: 'Past Prime' }
]

export function WineInventoryList({
  wines,
  onWineView,
  onWineEdit,
  onWineConsume,
  onWineDelete,
  onFiltersChange,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  useSearch = false
}: WineInventoryListProps) {
  // If search is enabled, use the new search interface
  if (useSearch) {
    return (
      <WineSearchInterface
        onWineView={onWineView}
        onWineEdit={onWineEdit}
        onWineConsume={onWineConsume}
        onWineDelete={onWineDelete}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    )
  }

  // Fallback to original implementation for backward compatibility
  if (!wines) {
    wines = []
  }
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    type: [],
    sortBy: 'name',
    sortOrder: 'asc'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange('search', localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.type || []
    const newTypes = currentTypes.includes(type as any)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as any]
    
    handleFilterChange('type', newTypes)
  }

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.drinkingWindowStatus || []
    const newStatuses = currentStatuses.includes(status as any)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status as any]
    
    handleFilterChange('drinkingWindowStatus', newStatuses)
  }

  const clearFilters = () => {
    const clearedFilters: InventoryFilters = {
      search: '',
      type: [],
      sortBy: 'name',
      sortOrder: 'asc'
    }
    setFilters(clearedFilters)
    setLocalSearch('')
    onFiltersChange?.(clearedFilters)
  }

  const hasActiveFilters = () => {
    return filters.search || 
           (filters.type && filters.type.length > 0) ||
           (filters.drinkingWindowStatus && filters.drinkingWindowStatus.length > 0) ||
           filters.vintage ||
           filters.priceRange ||
           filters.rating
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search wines, producers, regions..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('sortOrder', 
                  filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Icon 
                  name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  className="h-4 w-4" 
                />
              </Button>
            </div>

            {/* View Mode Toggle */}
            {onViewModeChange && (
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="rounded-none border-0"
                >
                  <Icon name="grid" className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="rounded-none border-0 border-l border-gray-300"
                >
                  <Icon name="list" className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon name="filter" className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters() && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Wine Types */}
              <div>
                <label className="block text-sm font-medium mb-2">Wine Types</label>
                <div className="flex flex-wrap gap-2">
                  {WINE_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant={filters.type?.includes(type.value as any) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleTypeToggle(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Drinking Window Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Drinking Window</label>
                <div className="flex flex-wrap gap-2">
                  {DRINKING_WINDOW_STATUS.map(status => (
                    <Button
                      key={status.value}
                      variant={filters.drinkingWindowStatus?.includes(status.value as any) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusToggle(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Vintage Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Vintage Range</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="From"
                    value={filters.vintage?.min || ''}
                    onChange={(e) => handleFilterChange('vintage', {
                      ...filters.vintage,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="To"
                    value={filters.vintage?.max || ''}
                    onChange={(e) => handleFilterChange('vintage', {
                      ...filters.vintage,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Rating Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Rating Range</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Min"
                    value={filters.rating?.min || ''}
                    onChange={(e) => handleFilterChange('rating', {
                      ...filters.rating,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-20"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Max"
                    value={filters.rating?.max || ''}
                    onChange={(e) => handleFilterChange('rating', {
                      ...filters.rating,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters() && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <Icon name="x" className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {wines.length} {wines.length === 1 ? 'wine' : 'wines'} found
        </p>
      </div>

      {/* Wine Grid/List */}
      {wines.length === 0 ? (
        <EmptyState
          icon="wine"
          title="No wines found"
          description={hasActiveFilters() ? 'Try adjusting your filters to see more results.' : 'Start building your wine collection by adding your first bottle.'}
          aria-label="Inventory empty state"
        >
          {hasActiveFilters() && (
            <Button variant="outline" onClick={clearFilters} aria-label="Clear filters">
              Clear Filters
            </Button>
          )}
          <button
            type="button"
            onClick={() => {
              // Client-only sample add
              if (typeof window !== 'undefined') {
                try {
                  const event = new CustomEvent('sample_wine_add_request')
                  window.dispatchEvent(event)
                } catch {}
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Add sample wine"
          >
            Add sample
          </button>
        </EmptyState>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {wines.map(wine => (
            <WineCard
              key={wine.id}
              wine={wine}
              onView={onWineView}
              onEdit={onWineEdit}
              onConsume={onWineConsume}
              onDelete={onWineDelete}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  )
}