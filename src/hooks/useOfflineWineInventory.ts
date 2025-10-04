/**
 * Offline Wine Inventory Hook
 * 
 * Provides offline-first wine inventory management with automatic sync
 * when connection is restored.
 */

import { useState, useEffect, useCallback } from 'react'
import { Wine } from '@/types'
import { offlineCacheService } from '@/lib/services/offline-cache'
import { usePWA } from './usePWA'

interface OfflineWineInventoryState {
  wines: Wine[]
  isLoading: boolean
  isOffline: boolean
  hasPendingSync: boolean
  lastSyncTime: Date | null
  error: string | null
}

interface OfflineWineInventoryActions {
  addWine: (wine: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateWine: (wineId: string, updates: Partial<Wine>) => Promise<void>
  deleteWine: (wineId: string) => Promise<void>
  refreshInventory: () => Promise<void>
  syncPendingChanges: () => Promise<void>
  clearOfflineData: () => Promise<void>
}

export function useOfflineWineInventory(userId: string): OfflineWineInventoryState & OfflineWineInventoryActions {
  const { isOnline } = usePWA()
  const [state, setState] = useState<OfflineWineInventoryState>({
    wines: [],
    isLoading: true,
    isOffline: !isOnline,
    hasPendingSync: false,
    lastSyncTime: null,
    error: null,
  })

  // Update offline status
  useEffect(() => {
    setState(prev => ({ ...prev, isOffline: !isOnline }))
  }, [isOnline])

  // Load initial data
  useEffect(() => {
    loadWineInventory()
  }, [userId])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && state.hasPendingSync) {
      syncPendingChanges()
    }
  }, [isOnline, state.hasPendingSync])

  const loadWineInventory = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Try to load from cache first
      const cachedWines = await offlineCacheService.getCachedWines(userId)
      
      if (cachedWines) {
        setState(prev => ({
          ...prev,
          wines: cachedWines,
          isLoading: false,
        }))
      }

      // If online, fetch fresh data
      if (isOnline) {
        // This would be your actual API call to Supabase
        // const { data: freshWines, error } = await supabase
        //   .from('wines')
        //   .select('*')
        //   .eq('userId', userId)
        
        // For now, we'll simulate with cached data
        const freshWines = cachedWines || []
        
        if (freshWines) {
          await offlineCacheService.cacheWines(userId, freshWines)
          setState(prev => ({
            ...prev,
            wines: freshWines,
            lastSyncTime: new Date(),
          }))
        }
      }
    } catch (error) {
      console.error('Error loading wine inventory:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load wine inventory',
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [userId, isOnline])

  const addWine = useCallback(async (wineData: Omit<Wine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newWine: Wine = {
      ...wineData,
      id: `temp-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Update local state immediately
    setState(prev => ({
      ...prev,
      wines: [...prev.wines, newWine],
      hasPendingSync: true,
    }))

    // Cache the wine locally
    await offlineCacheService.cacheWine(newWine)

    // Queue for sync if offline
    if (!isOnline) {
      await offlineCacheService.queueOfflineOperation({
        operation: 'create',
        table: 'wines',
        data: newWine,
      })
    } else {
      // Sync immediately if online
      try {
        // This would be your actual API call
        // const { data, error } = await supabase
        //   .from('wines')
        //   .insert([wineData])
        //   .select()
        
        console.log('Wine added online:', newWine)
        setState(prev => ({ ...prev, hasPendingSync: false }))
      } catch (error) {
        console.error('Error adding wine online:', error)
        // Queue for later sync
        await offlineCacheService.queueOfflineOperation({
          operation: 'create',
          table: 'wines',
          data: newWine,
        })
      }
    }
  }, [isOnline])

  const updateWine = useCallback(async (wineId: string, updates: Partial<Wine>) => {
    // Update local state immediately
    setState(prev => ({
      ...prev,
      wines: prev.wines.map(wine => 
        wine.id === wineId 
          ? { ...wine, ...updates, updatedAt: new Date() }
          : wine
      ),
      hasPendingSync: true,
    }))

    // Update cached wine
    const updatedWine = state.wines.find(w => w.id === wineId)
    if (updatedWine) {
      const finalWine = { ...updatedWine, ...updates, updatedAt: new Date() }
      await offlineCacheService.cacheWine(finalWine)
    }

    // Queue for sync if offline
    if (!isOnline) {
      await offlineCacheService.queueOfflineOperation({
        operation: 'update',
        table: 'wines',
        data: { id: wineId, ...updates },
      })
    } else {
      // Sync immediately if online
      try {
        // This would be your actual API call
        // const { error } = await supabase
        //   .from('wines')
        //   .update(updates)
        //   .eq('id', wineId)
        
        console.log('Wine updated online:', wineId, updates)
        setState(prev => ({ ...prev, hasPendingSync: false }))
      } catch (error) {
        console.error('Error updating wine online:', error)
        await offlineCacheService.queueOfflineOperation({
          operation: 'update',
          table: 'wines',
          data: { id: wineId, ...updates },
        })
      }
    }
  }, [isOnline, state.wines])

  const deleteWine = useCallback(async (wineId: string) => {
    // Update local state immediately
    setState(prev => ({
      ...prev,
      wines: prev.wines.filter(wine => wine.id !== wineId),
      hasPendingSync: true,
    }))

    // Queue for sync if offline
    if (!isOnline) {
      await offlineCacheService.queueOfflineOperation({
        operation: 'delete',
        table: 'wines',
        data: { id: wineId },
      })
    } else {
      // Sync immediately if online
      try {
        // This would be your actual API call
        // const { error } = await supabase
        //   .from('wines')
        //   .delete()
        //   .eq('id', wineId)
        
        console.log('Wine deleted online:', wineId)
        setState(prev => ({ ...prev, hasPendingSync: false }))
      } catch (error) {
        console.error('Error deleting wine online:', error)
        await offlineCacheService.queueOfflineOperation({
          operation: 'delete',
          table: 'wines',
          data: { id: wineId },
        })
      }
    }
  }, [isOnline])

  const refreshInventory = useCallback(async () => {
    await loadWineInventory()
  }, [loadWineInventory])

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) {return}

    try {
      await offlineCacheService.processSyncQueue()
      setState(prev => ({ 
        ...prev, 
        hasPendingSync: false,
        lastSyncTime: new Date(),
      }))
    } catch (error) {
      console.error('Error syncing pending changes:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to sync pending changes',
      }))
    }
  }, [isOnline])

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineCacheService.clearAllCache()
      setState(prev => ({
        ...prev,
        wines: [],
        hasPendingSync: false,
        lastSyncTime: null,
      }))
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }, [])

  return {
    ...state,
    addWine,
    updateWine,
    deleteWine,
    refreshInventory,
    syncPendingChanges,
    clearOfflineData,
  }
}