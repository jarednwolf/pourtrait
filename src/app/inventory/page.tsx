'use client'

import React, { useState, useEffect } from 'react'
// import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { WineService } from '@/lib/services/wine-service'
import { useEnhancedWineService } from '@/lib/services/wine-service-enhanced'
import { 
  WineInventoryList, 
  WineEntryForm, 
  WineDetailPage, 
  ConsumptionForm,
  InventoryDashboard,
  type ConsumptionData 
} from '@/components/wine'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Wine, InventoryFilters, WineInput, ConsumptionRecord } from '@/types'

type ViewMode = 'dashboard' | 'list' | 'add' | 'edit' | 'detail' | 'consume'
type ListViewMode = 'grid' | 'list'

export default function InventoryPage() {
  const { user } = useAuth()
  const enhancedWineService = useEnhancedWineService(user?.id || '')
  // const search = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [listViewMode, setListViewMode] = useState<ListViewMode>('grid')
  const [allWines, setAllWines] = useState<Wine[]>([])
  const [filteredWines, setFilteredWines] = useState<Wine[]>([])
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionRecord[]>([])
  const [inventoryStats, setInventoryStats] = useState({
    totalWines: 0,
    totalBottles: 0,
    ratedWines: 0,
    averageRating: 0,
    redWines: 0,
    whiteWines: 0,
    sparklingWines: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Client-only listener for adding a sample wine without server calls
  useEffect(() => {
    const handler = () => {
      // Minimal demo sample wine compatible with Wine type
      const sample = {
        id: `sample-${Date.now()}`,
        userId: user?.id || 'demo',
        name: 'Pinot Noir',
        producer: 'Willamette Estates',
        vintage: 2021,
        region: 'Willamette Valley',
        country: 'USA',
        varietal: ['Pinot Noir'],
        type: 'red' as const,
        quantity: 1,
        purchasePrice: 24.99,
        purchaseDate: undefined,
        drinkingWindow: {
          earliestDate: new Date(),
          peakStartDate: new Date(),
          peakEndDate: new Date(),
          latestDate: new Date(),
          currentStatus: 'ready' as const
        },
        personalRating: 8,
        personalNotes: 'Sample added for demo',
        imageUrl: undefined,
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Track event
      try {
        const { track } = require('@/lib/utils/track')
        track('sample_wine_added', { source: 'inventory_empty_state' })
      } catch {}

      setAllWines(prev => [sample, ...prev])
      setFilteredWines(prev => [sample, ...prev])
      setCurrentView('list')
    }

    let cleanup: (() => void) | undefined
    if (typeof window !== 'undefined') {
      window.addEventListener('sample_wine_add_request', handler as EventListener)
      cleanup = () => window.removeEventListener('sample_wine_add_request', handler as EventListener)
    }
    return () => {
      if (cleanup) {cleanup()}
    }
  }, [user])

  // Support cross-page trigger via query param: ?addSample=1
  useEffect(() => {
    if (typeof window === 'undefined') {return}
    const params = new URLSearchParams(window.location.search)
    if (params.get('addSample') === '1') {
      window.dispatchEvent(new CustomEvent('sample_wine_add_request'))
      params.delete('addSample')
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
      window.history.replaceState({}, '', nextUrl)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadInventoryData()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadInventoryData = async () => {
    if (!user) {return}

    try {
      setIsLoading(true)
      const [winesData, statsData] = await Promise.all([
        enhancedWineService.getUserWines(),
        WineService.getInventoryStats(user.id)
      ])
      
      setAllWines(winesData)
      setFilteredWines(winesData)
      setInventoryStats(statsData)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
    return
  }

  const handleFiltersChange = async (filters: InventoryFilters) => {
    if (!user) {
      return
    }

    try {
      // For now, apply filters client-side since enhanced service doesn't support filters yet
      // TODO: Implement server-side filtering in enhanced service
      let filtered = [...allWines]
      
      if (filters.type && filters.type.length > 0) {
        filtered = filtered.filter(wine => filters.type!.includes(wine.type))
      }
      
      if (filters.drinkingWindowStatus && filters.drinkingWindowStatus.length > 0) {
        filtered = filtered.filter(wine => 
          filters.drinkingWindowStatus!.includes(wine.drinkingWindow.currentStatus)
        )
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(wine => 
          wine.name.toLowerCase().includes(searchLower) ||
          wine.producer.toLowerCase().includes(searchLower) ||
          wine.region.toLowerCase().includes(searchLower)
        )
      }
      
      setFilteredWines(filtered)
    } catch (error) {
      console.error('Failed to apply filters:', error)
    }
  }

  const handleAddWine = async (wineData: WineInput) => {
    if (!user) {
      return
    }

    try {
      setIsSubmitting(true)
      await enhancedWineService.createWine(wineData)
      await loadInventoryData()
      setCurrentView('list')
    } catch (error) {
      console.error('Failed to add wine:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditWine = async (wineData: WineInput) => {
    if (!user || !selectedWine) {
      return
    }

    try {
      setIsSubmitting(true)
      await enhancedWineService.updateWine(selectedWine.id, wineData)
      await loadInventoryData()
      setCurrentView('detail')
    } catch (error) {
      console.error('Failed to update wine:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWine = async (wine: Wine) => {
    try {
      await WineService.deleteWine(wine.id)
      await loadInventoryData()
      setCurrentView('list')
      setSelectedWine(null)
    } catch (error) {
      console.error('Failed to delete wine:', error)
    }
  }

  const handleWineView = async (wine: Wine) => {
    setSelectedWine(wine)
    
    // Load consumption history for this wine
    if (!user) {
      return
    }
    
    try {
      const history = await WineService.getConsumptionHistory(user.id)
      const wineHistory = history.filter(record => record.wineId === wine.id)
      setConsumptionHistory(wineHistory)
    } catch (error) {
      console.error('Failed to load consumption history:', error)
      setConsumptionHistory([])
    }
    
    setCurrentView('detail')
  }

  const handleWineEdit = (wine: Wine) => {
    setSelectedWine(wine)
    setCurrentView('edit')
  }

  const handleWineConsume = (wine: Wine) => {
    setSelectedWine(wine)
    setCurrentView('consume')
  }

  const handleConsumptionSubmit = async (data: ConsumptionData) => {
    if (!selectedWine || !user) {
      return
    }

    try {
      setIsSubmitting(true)
      await WineService.markConsumed(
        selectedWine.id,
        data.consumedAt,
        data.rating,
        data.notes,
        data.occasion,
        data.companions,
        data.foodPairing
      )
      await loadInventoryData()
      setCurrentView('detail')
      
      // Reload consumption history
      const history = await WineService.getConsumptionHistory(user.id)
      const wineHistory = history.filter(record => record.wineId === selectedWine.id)
      setConsumptionHistory(wineHistory)
    } catch (error) {
      console.error('Failed to record consumption:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderNavigation = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Wine Inventory</h1>
        
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <Button
            variant={currentView === 'dashboard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="rounded-none border-0"
          >
            <Icon name="pie-chart" className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('list')}
            className="rounded-none border-0 border-l border-gray-300"
          >
            <Icon name="list" className="h-4 w-4 mr-2" />
            Inventory
          </Button>
        </div>
      </div>

      <Button onClick={() => setCurrentView('add')}>
        <Icon name="plus" className="h-4 w-4 mr-2" />
        Add Wine
      </Button>
    </div>
  )

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="wine" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please sign in to access your wine inventory
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {currentView !== 'detail' && currentView !== 'add' && currentView !== 'edit' && renderNavigation()}

      {currentView === 'dashboard' && (
        <InventoryDashboard 
          stats={inventoryStats} 
          wines={allWines}
          userId={user.id}
          isLoading={isLoading} 
        />
      )}

      {currentView === 'list' && (
        <WineInventoryList
          wines={filteredWines}
          onWineView={handleWineView}
          onWineEdit={handleWineEdit}
          onWineConsume={handleWineConsume}
          onWineDelete={handleDeleteWine}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
          viewMode={listViewMode}
          onViewModeChange={setListViewMode}
          useSearch={true}
        />
      )}

      {currentView === 'add' && (
        <WineEntryForm
          onSubmit={handleAddWine}
          onCancel={() => setCurrentView('list')}
          isLoading={isSubmitting}
        />
      )}

      {currentView === 'edit' && selectedWine && (
        <WineEntryForm
          onSubmit={handleEditWine}
          onCancel={() => setCurrentView('detail')}
          initialData={{
            name: selectedWine.name,
            producer: selectedWine.producer,
            vintage: selectedWine.vintage,
            region: selectedWine.region,
            country: selectedWine.country,
            varietal: selectedWine.varietal,
            type: selectedWine.type as any,
            quantity: selectedWine.quantity || 0,
            purchasePrice: selectedWine.purchasePrice || undefined,
            purchaseDate: selectedWine.purchaseDate || undefined,
            personalRating: selectedWine.personalRating || undefined,
            personalNotes: selectedWine.personalNotes || '',
            imageUrl: selectedWine.imageUrl || undefined
          }}
          isLoading={isSubmitting}
        />
      )}

      {currentView === 'detail' && selectedWine && (
        <WineDetailPage
          wine={selectedWine}
          consumptionHistory={consumptionHistory}
          onEdit={handleWineEdit}
          onConsume={handleWineConsume}
          onDelete={handleDeleteWine}
          onBack={() => setCurrentView('list')}
        />
      )}

      {currentView === 'consume' && selectedWine && (
        <ConsumptionForm
          wine={selectedWine}
          onSubmit={handleConsumptionSubmit}
          onCancel={() => setCurrentView('detail')}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}