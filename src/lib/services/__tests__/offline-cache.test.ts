/**
 * Offline Cache Service Tests
 * 
 * Tests for offline data caching functionality using IndexedDB
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { offlineCacheService } from '../offline-cache'
import { Wine } from '@/types'

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(false),
  },
}

const mockIDBObjectStore = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  createIndex: vi.fn(),
}

const mockIDBTransaction = {
  objectStore: vi.fn().mockReturnValue(mockIDBObjectStore),
}

const mockIDBRequest: {
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  result: unknown
} = {
  onsuccess: null,
  onerror: null,
  result: null,
}

const mockIndexedDB = {
  open: vi.fn(),
}

// Setup global mocks
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

Object.defineProperty(global, 'IDBOpenDBRequest', {
  value: function IDBOpenDBRequest() {
    // Non-empty body to satisfy no-empty-function rule in tests
    return undefined
  },
  writable: true,
})

// Mock wine data
const mockWine: Wine = {
  id: 'wine-1',
  userId: 'user-1',
  name: 'Test Wine',
  producer: 'Test Producer',
  vintage: 2020,
  region: 'Test Region',
  country: 'Test Country',
  varietal: ['Cabernet Sauvignon'],
  type: 'red',
  quantity: 1,
  drinkingWindow: {
    earliestDate: new Date('2023-01-01'),
    peakStartDate: new Date('2024-01-01'),
    peakEndDate: new Date('2026-01-01'),
    latestDate: new Date('2028-01-01'),
    currentStatus: 'ready',
  },
  externalData: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('OfflineCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful database initialization
    mockIndexedDB.open.mockImplementation(() => {
      const request = { ...mockIDBRequest }
      setTimeout(() => {
        request.result = mockIDBDatabase
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      return request
    })

    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction)
  })

  describe('initialization', () => {
    it('should initialize database successfully', async () => {
      await expect(offlineCacheService.initialize()).resolves.toBeUndefined()
      expect(mockIndexedDB.open).toHaveBeenCalledWith('pourtrait-cache', 1)
    })

    it('should handle database initialization errors', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        setTimeout(() => {
          if (request.onerror) {
            request.onerror()
          }
        }, 0)
        return request
      })

      await expect(offlineCacheService.initialize()).rejects.toBeDefined()
    })
  })

  describe('wine caching', () => {
    beforeEach(async () => {
      await offlineCacheService.initialize()
    })

    it('should cache wines for a user', async () => {
      const wines = [mockWine]
      
      mockIDBObjectStore.put.mockImplementation((_data) => {
        const request = { ...mockIDBRequest }
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      await expect(offlineCacheService.cacheWines('user-1', wines)).resolves.toBeUndefined()
      expect(mockIDBObjectStore.put).toHaveBeenCalled()
    })

    it('should retrieve cached wines for a user', async () => {
      const cachedData = {
        data: [mockWine],
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        version: '1.0',
      }

      mockIDBObjectStore.get.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        request.result = cachedData
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      const result = await offlineCacheService.getCachedWines('user-1')
      expect(result).toEqual([mockWine])
      expect(mockIDBObjectStore.get).toHaveBeenCalledWith('wines-user-1')
    })

    it('should return null for expired cache', async () => {
      const expiredData = {
        data: [mockWine],
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // Expired 24 hours ago
        version: '1.0',
      }

      mockIDBObjectStore.get.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        request.result = expiredData
        setTimeout(() => {
          if (request.onsuccess) {request.onsuccess()}
        }, 0)
        return request
      })

      const result = await offlineCacheService.getCachedWines('user-1')
      expect(result).toBeNull()
    })

    it('should cache individual wine', async () => {
      mockIDBObjectStore.put.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      await expect(offlineCacheService.cacheWine(mockWine)).resolves.toBeUndefined()
      expect(mockIDBObjectStore.put).toHaveBeenCalled()
    })

    it('should retrieve cached individual wine', async () => {
      const cachedData = {
        data: mockWine,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        version: '1.0',
      }

      mockIDBObjectStore.get.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        request.result = cachedData
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      const result = await offlineCacheService.getCachedWine('wine-1')
      expect(result).toEqual(mockWine)
    })
  })

  describe('offline operations queue', () => {
    beforeEach(async () => {
      await offlineCacheService.initialize()
    })

    it('should queue offline operations', async () => {
      mockIDBObjectStore.put.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        setTimeout(() => {
          if (request.onsuccess) {request.onsuccess()}
        }, 0)
        return request
      })

      await expect(offlineCacheService.queueOfflineOperation({
        operation: 'create',
        table: 'wines',
        data: mockWine,
      })).resolves.toBeUndefined()

      expect(mockIDBObjectStore.put).toHaveBeenCalled()
    })

    it('should process sync queue when online', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      })

      // Mock empty sync queue
      mockIDBObjectStore.get.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        request.result = { key: 'syncQueue', data: [] }
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      await expect(offlineCacheService.processSyncQueue()).resolves.toBeUndefined()
    })

    it('should not process sync queue when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      })

      await expect(offlineCacheService.processSyncQueue()).resolves.toBeUndefined()
      // Should not attempt any sync operations
    })
  })

  describe('network status', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      })

      expect(offlineCacheService.isOnline()).toBe(true)
    })

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      })

      expect(offlineCacheService.isOnline()).toBe(false)
    })

    it('should handle network change events', () => {
      const callback = vi.fn()
      const cleanup = offlineCacheService.onNetworkChange(callback)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      })
      window.dispatchEvent(new Event('offline'))

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      })
      window.dispatchEvent(new Event('online'))

      cleanup()
      expect(callback).toHaveBeenCalledWith(false)
      expect(callback).toHaveBeenCalledWith(true)
    })
  })

  describe('cache management', () => {
    beforeEach(async () => {
      await offlineCacheService.initialize()
    })

    it('should clear all cache', async () => {
      mockIDBObjectStore.clear.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      await expect(offlineCacheService.clearAllCache()).resolves.toBeUndefined()
      expect(mockIDBObjectStore.clear).toHaveBeenCalled()
    })

    it('should get cache size', async () => {
      mockIDBObjectStore.count.mockImplementation(() => {
        const request = { ...mockIDBRequest }
        request.result = 5
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess()
          }
        }, 0)
        return request
      })

      const size = await offlineCacheService.getCacheSize()
      expect(size).toBeGreaterThan(0)
    })
  })
})