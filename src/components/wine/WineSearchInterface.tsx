'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { WineCard } from './WineCard'
import { useWineSearch } from '@/hooks/useWineSearch'
import type { SearchFilters, QuickFilter, SavedSearch } from '@/types'
import type { Wine } from '@/lib/supabase'

interface WineSearchInterfaceProps {
  onWineView?: (wine: Wine) => void
  onWineEdit?: (wine: Wine) => void
  onWineConsume?: (wine: Wine) => void
  onWineDelete?: (wine: Wine) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

const WINE_TYPES = [
  { value: 'red', label: 'Red', color: 'bg-red-100 text-red-800' },
  { value: 'white', label: 'White', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rosé', label: 'Rosé', color: 'bg-pink-100 text-pink-800' },
  { value: 'sparkling', label: 'Sparkling', color: 'bg-blue-100 text-blue-800' },
  { value: 'dessert', label: 'Dessert', color: 'bg-purple-100 text-purple-800' },
  { value: 'fortified', label: 'Fortified', color: 'bg-orange-100 text-orange-800' }
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name' },
  { value: 'producer', label: 'Producer' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'rating', label: 'Rating' },
  { value: 'purchaseDate', label: 'Purchase Date' },
  { value: 'price', label: 'Price' }
]

export function WineSearchInterface({
  onWineView,
  onWineEdit,
  onWineConsume,
  onWineDelete,
  viewMode = 'grid',
  onViewModeChange
}: WineSearchInterfaceProps) {
  const {
    results,
    facets,
    suggestions,
    isLoading,
    error,
    filters,
    updateFilter,
    clearFilters,
    search,
    loadMore,
    getSuggestions,
    clearSuggestions,
    savedSearches,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    quickFilters,
    applyQuickFilter,
    hasActiveFilters,
    canLoadMore
  } = useWineSearch({
    autoSearch: true,
    enableFacets: true,
    enableSuggestions: true
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    updateFilter('query', value)
    if (value.length >= 2) {
      getSuggestions(value)
      setShowSuggestions(true)
    } else {
      clearSuggestions()
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    updateFilter('query', suggestion.value)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle filter toggles
  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.type || []
    const newTypes = currentTypes.includes(type as any)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as any]
    updateFilter('type', newTypes)
  }

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return
    
    try {
      await saveCurrentSearch(saveSearchName.trim())
      setSaveSearchName('')
      setShowSaveDialog(false)
    } catch (err) {
      console.error('Failed to save search:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <div className="relative">
                <Icon 
                  name="search" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
                />
                <Input
                  ref={searchInputRef}
                  placeholder="Search wines, producers, regions, varietals..."
                  value={filters.query || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
                {filters.query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilter('query', '')
                      clearSuggestions()
                      setShowSuggestions(false)
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon 
                          name={suggestion.type === 'wine' ? 'wine' : 
                                suggestion.type === 'producer' ? 'building' :
                                suggestion.type === 'region' ? 'map-pin' : 'grape'}
                          className="h-4 w-4 text-gray-400"
                        />
                        <span>{suggestion.label}</span>
                      </div>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.slice(0, 6).map(filter => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickFilter(filter)}
                  className="text-xs"
                >
                  {filter.icon && <Icon name={filter.icon as any} className="h-3 w-3 mr-1" />}
                  {filter.name}
                </Button>
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Icon name="filter" className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="default" className="ml-2 h-4 w-4 p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>

                {/* Saved Searches */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                >
                  <Icon name="bookmark" className="h-4 w-4 mr-2" />
                  Saved
                </Button>

                {/* Save Current Search */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Icon name="save" className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <Icon name="x" className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={filters.sortBy || 'name'}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onClick={() => updateFilter('sortOrder', 
                    filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <Icon 
                    name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                    className="h-4 w-4" 
                  />
                </Button>

                {/* View Mode Toggle */}
                {onViewModeChange && (
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('grid')}
                      className="rounded-none border-0"
                    >
                      <Icon name="grid" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('list')}
                      className="rounded-none border-0 border-l border-gray-300"
                    >
                      <Icon name="list" className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wine Types */}
            <div>
              <label className="block text-sm font-medium mb-2">Wine Types</label>
              <div className="flex flex-wrap gap-2">
                {WINE_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant={filters.type?.includes(type.value as any) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTypeToggle(type.value)}
                    className="text-xs"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Faceted Filters */}
            {facets && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Regions */}
                {facets.regions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Regions</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {facets.regions.slice(0, 10).map(facet => (
                        <label key={facet.value} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.region?.includes(facet.value) || false}
                            onChange={(e) => {
                              const currentRegions = filters.region || []
                              const newRegions = e.target.checked
                                ? [...currentRegions, facet.value]
                                : currentRegions.filter(r => r !== facet.value)
                              updateFilter('region', newRegions)
                            }}
                            className="rounded"
                          />
                          <span>{facet.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {facet.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Producers */}
                {facets.producers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Producers</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {facets.producers.slice(0, 10).map(facet => (
                        <label key={facet.value} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.producer?.includes(facet.value) || false}
                            onChange={(e) => {
                              const currentProducers = filters.producer || []
                              const newProducers = e.target.checked
                                ? [...currentProducers, facet.value]
                                : currentProducers.filter(p => p !== facet.value)
                              updateFilter('producer', newProducers)
                            }}
                            className="rounded"
                          />
                          <span>{facet.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {facet.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Varietals */}
                {facets.varietals.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Varietals</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {facets.varietals.slice(0, 10).map(facet => (
                        <label key={facet.value} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filters.varietal?.includes(facet.value) || false}
                            onChange={(e) => {
                              const currentVarietals = filters.varietal || []
                              const newVarietals = e.target.checked
                                ? [...currentVarietals, facet.value]
                                : currentVarietals.filter(v => v !== facet.value)
                              updateFilter('varietal', newVarietals)
                            }}
                            className="rounded"
                          />
                          <span>{facet.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {facet.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vintage Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Vintage Range</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="From"
                    value={filters.vintage?.min || ''}
                    onChange={(e) => updateFilter('vintage', {
                      ...filters.vintage,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24 text-sm"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <Input
                    type="number"
                    placeholder="To"
                    value={filters.vintage?.max || ''}
                    onChange={(e) => updateFilter('vintage', {
                      ...filters.vintage,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-24 text-sm"
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
                    onChange={(e) => updateFilter('rating', {
                      ...filters.rating,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-20 text-sm"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Max"
                    value={filters.rating?.max || ''}
                    onChange={(e) => updateFilter('rating', {
                      ...filters.rating,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-20 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches Panel */}
      {showSavedSearches && savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedSearches.map(savedSearch => (
                <div key={savedSearch.id} className="flex items-center justify-between p-2 border rounded">
                  <button
                    onClick={() => loadSavedSearch(savedSearch)}
                    className="flex-1 text-left hover:text-blue-600"
                  >
                    <div className="font-medium">{savedSearch.name}</div>
                    {savedSearch.isDefault && (
                      <Badge variant="secondary" className="text-xs mt-1">Default</Badge>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSavedSearch(savedSearch.id)}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Save Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search name..."
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600 flex items-center">
              <Icon name="alert-circle" className="h-5 w-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {results && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {results.total} {results.total === 1 ? 'wine' : 'wines'} found
            {filters.query && ` for "${filters.query}"`}
          </p>
        </div>
      )}

      {/* Wine Results */}
      {isLoading && !results ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : results && results.items.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {results.items.map(wine => (
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

          {/* Load More */}
          {canLoadMore && (
            <div className="flex justify-center">
              <Button
                onClick={loadMore}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      ) : results && results.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Icon name="search" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wines found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or filters.'
                : 'Start by searching for wines in your collection.'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}