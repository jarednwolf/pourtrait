/**
 * Offline Cache Service
 * 
 * Provides offline-first data caching capabilities for core wine inventory features.
 * Uses IndexedDB for persistent storage and implements Supabase offline patterns.
 */

import { Wine } from '@/types'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  version: string
}

interface SyncQueueItem {
  id: string
  operation: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retryCount: number
}

class OfflineCacheService {
  private dbName = 'pourtrait-cache'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncQueue: SyncQueueItem[] = []

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.loadSyncQueue()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Wine inventory cache
        if (!db.objectStoreNames.contains('wines')) {
          const wineStore = db.createObjectStore('wines', { keyPath: 'id' })
          wineStore.createIndex('userId', 'userId', { unique: false })
          wineStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // User preferences cache
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'userId' })
        }

        // Recommendations cache
        if (!db.objectStoreNames.contains('recommendations')) {
          const recStore = db.createObjectStore('recommendations', { keyPath: 'id' })
          recStore.createIndex('userId', 'userId', { unique: false })
          recStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Sync queue for offline operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // App metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  // Wine inventory caching
  async cacheWines(userId: string, wines: Wine[]): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized')}

    const transaction = this.db.transaction(['wines'], 'readwrite')
    const store = transaction.objectStore('wines')

    const cacheEntry: CacheEntry<Wine[]> = {
      data: wines,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      version: '1.0'
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id: `wines-${userId}`, ...cacheEntry })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedWines(userId: string): Promise<Wine[] | null> {
    if (!this.db) {throw new Error('Database not initialized')}

    const transaction = this.db.transaction(['wines'], 'readonly')
    const store = transaction.objectStore('wines')

    return new Promise((resolve, reject) => {
      const request = store.get(`wines-${userId}`)
      request.onsuccess = () => {
        const result = request.result as CacheEntry<Wine[]> | undefined
        if (!result) {
          resolve(null)
          return
        }

        // Check if cache is expired
        if (Date.now() > result.expiresAt) {
          this.clearExpiredCache('wines', `wines-${userId}`)
          resolve(null)
          return
        }

        resolve(result.data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Individual wine caching for quick access
  async cacheWine(wine: Wine): Promise<void> {
    if (!this.db) {throw new Error('Database not initialized')}

    const transaction = this.db.transaction(['wines'], 'readwrite')
    const store = transaction.objectStore('wines')

    const cacheEntry: CacheEntry<Wine> = {
      data: wine,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      version: '1.0'
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id: wine.id, ...cacheEntry })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedWine(wineId: string): Promise<Wine | null> {
    if (!this.db) {throw new Error('Database not initialized')}

    const transaction = this.db.transaction(['wines'], 'readonly')
    const store = transaction.objectStore('wines')

    return new Promise((resolve, reject) => {
      const request = store.get(wineId)
      request.onsuccess = () => {
        const result = request.result as CacheEntry<Wine> | undefined
        if (!result) {
          resolve(null)
          return
        }

        if (Date.now() > result.expiresAt) {
          this.clearExpiredCache('wines', wineId)
          resolve(null)
          return
        }

        resolve(result.data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Offline operations queue
  async queueOfflineOperation(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...operation,
      id: `${operation.table}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(queueItem)
    await this.saveSyncQueue()
  }

  async processSyncQueue(): Promise<void> {
    if (!navigator.onLine || this.syncQueue.length === 0) {return}

    const itemsToProcess = [...this.syncQueue]
    this.syncQueue = []

    for (const item of itemsToProcess) {
      try {
        await this.syncOperation(item)
      } catch (error) {
        console.error('Sync operation failed:', error)
        
        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++
          this.syncQueue.push(item)
        } else {
          console.error('Max retries exceeded for sync operation:', item)
        }
      }
    }

    await this.saveSyncQueue()
  }

  private async syncOperation(item: SyncQueueItem): Promise<void> {
    // This would integrate with your Supabase client
    // For now, we'll simulate the sync operation
    console.log('Syncing operation:', item)
    
    // Example implementation:
    // const { data, error } = await supabase
    //   .from(item.table)
    //   [item.operation](item.data)
    
    // if (error) throw error
  }

  private async saveSyncQueue(): Promise<void> {
    if (!this.db) {return}

    const transaction = this.db.transaction(['metadata'], 'readwrite')
    const store = transaction.objectStore('metadata')

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: 'syncQueue', data: this.syncQueue })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) {return}

    const transaction = this.db.transaction(['metadata'], 'readonly')
    const store = transaction.objectStore('metadata')

    return new Promise((resolve) => {
      const request = store.get('syncQueue')
      if (!request) {return resolve()}
      request.onsuccess = () => {
        const result = (request as any).result
        if (result && Array.isArray(result.data)) {
          this.syncQueue = result.data as SyncQueueItem[]
        } else if (result && result.data) {
          try {
            this.syncQueue = Array.from(result.data as any)
          } catch {
            this.syncQueue = []
          }
        }
        resolve()
      }
      request.onerror = () => resolve() // Continue even if loading fails
    })
  }

  private async clearExpiredCache(storeName: string, key: string): Promise<void> {
    if (!this.db) {return}

    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    store.delete(key)
  }

  // Network status handling
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {} // No-op for server-side
    }

    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // Cache management
  async clearAllCache(): Promise<void> {
    if (!this.db) {return}

    const storeNames = ['wines', 'preferences', 'recommendations']
    const transaction = this.db.transaction(storeNames, 'readwrite')

    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName)
      store.clear()
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) {return 0}

    let totalSize = 0
    const storeNames = ['wines', 'preferences', 'recommendations', 'syncQueue']

    for (const storeName of storeNames) {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      const count = await new Promise<number>((resolve) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(0)
      })
      
      totalSize += count
    }

    return totalSize
  }
}

export const offlineCacheService = new OfflineCacheService()

// Initialize the service when the module is loaded (client-side only)
if (
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  // Allow tests to disable auto init
  (window as any).__DISABLE_OFFLINE_CACHE__ !== true
) {
  offlineCacheService.initialize().catch(console.error)
}