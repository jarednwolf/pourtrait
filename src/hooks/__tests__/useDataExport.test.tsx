import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataExport } from '../useDataExport'

// Mock fetch
global.fetch = vi.fn()

// Mock URL and document for file download
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
})

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn()
  }))
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn()
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn()
})

describe('useDataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData', () => {
    it('should export data and trigger download', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('attachment; filename="test.csv"')
        },
        blob: vi.fn().mockResolvedValue(mockBlob)
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        await result.current.exportData('csv', { includePersonalNotes: true })
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          options: { includePersonalNotes: true }
        })
      })

      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle export errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Export failed' })
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        try {
          await result.current.exportData('csv')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Export failed')
      expect(result.current.isExporting).toBe(false)
    })

    it('should set loading state during export', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValue(promise)

      const { result } = renderHook(() => useDataExport())

      act(() => {
        result.current.exportData('csv')
      })

      expect(result.current.isExporting).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          headers: { get: () => 'attachment; filename="test.csv"' },
          blob: () => Promise.resolve(new Blob())
        })
      })

      expect(result.current.isExporting).toBe(false)
    })
  })

  describe('createBackup', () => {
    it('should create backup and trigger download', async () => {
      const mockBlob = new Blob(['backup data'], { type: 'application/json' })
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('attachment; filename="backup.json"')
        },
        blob: vi.fn().mockResolvedValue(mockBlob)
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        await result.current.createBackup()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/data/backup?action=create', {
        method: 'POST'
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('restoreBackup', () => {
    it('should restore backup from file', async () => {
      const mockFile = new File(['{"wines": []}'], 'backup.json', {
        type: 'application/json'
      })

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        await result.current.restoreBackup(mockFile)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/data/backup?action=restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupData: { wines: [] }
        })
      })

      expect(result.current.isRestoring).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle invalid JSON in backup file', async () => {
      const mockFile = new File(['invalid json'], 'backup.json', {
        type: 'application/json'
      })

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        try {
          await result.current.restoreBackup(mockFile)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toContain('Backup restore failed')
    })
  })

  describe('deleteAllData', () => {
    it('should delete all data with correct confirmation', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        await result.current.deleteAllData('DELETE_ALL_DATA')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/data/backup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmDelete: 'DELETE_ALL_DATA'
        })
      })

      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('getExportStats', () => {
    it('should fetch export statistics', async () => {
      const mockStats = {
        totalWines: 10,
        totalConsumptionRecords: 5,
        hasTasteProfile: true,
        accountCreated: '2020-01-01T00:00:00Z',
        lastActivity: '2023-01-01T00:00:00Z'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockStats)
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      let stats: any
      await act(async () => {
        stats = await result.current.getExportStats()
      })

      expect(stats).toEqual(mockStats)
      expect(global.fetch).toHaveBeenCalledWith('/api/data/export')
    })

    it('should handle stats fetch errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Failed to get stats' })
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useDataExport())

      await act(async () => {
        try {
          await result.current.getExportStats()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Failed to get stats')
    })
  })
})