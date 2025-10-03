import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataExportService } from '../data-export'
import { createClient } from '@/lib/supabase'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn()
}))

const mockSupabase = {
  from: vi.fn(),
  auth: {
    admin: {
      deleteUser: vi.fn()
    }
  }
}

const mockWines = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Château Margaux',
    producer: 'Château Margaux',
    vintage: 2015,
    region: 'Bordeaux',
    country: 'France',
    varietal: ['Cabernet Sauvignon', 'Merlot'],
    type: 'red',
    quantity: 2,
    purchase_price: 500,
    purchase_date: '2020-01-01',
    personal_rating: 9,
    personal_notes: 'Exceptional wine',
    drinking_window: {
      peak_start_date: '2025-01-01',
      peak_end_date: '2035-01-01',
      current_status: 'ready'
    },
    created_at: '2020-01-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'Dom Pérignon',
    producer: 'Moët & Chandon',
    vintage: 2012,
    region: 'Champagne',
    country: 'France',
    varietal: ['Chardonnay', 'Pinot Noir'],
    type: 'sparkling',
    quantity: 1,
    purchase_price: 200,
    personal_rating: 8,
    personal_notes: 'Great for celebrations',
    drinking_window: {
      peak_start_date: '2020-01-01',
      peak_end_date: '2030-01-01',
      current_status: 'peak'
    },
    created_at: '2020-02-01T00:00:00Z'
  }
]

describe('DataExportService', () => {
  let dataExportService: DataExportService
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      // Add default resolved values
      then: vi.fn().mockResolvedValue({ data: null, error: null })
    }

    // Make all methods return the query object for chaining
    Object.keys(mockQuery).forEach(key => {
      if (key !== 'then') {
        mockQuery[key].mockReturnValue(mockQuery)
      }
    })

    mockSupabase.from.mockReturnValue(mockQuery)
    ;(createClient as any).mockReturnValue(mockSupabase)
    
    dataExportService = new DataExportService()
  })

  describe('exportUserData', () => {
    it('should export user data with wines', async () => {
      // Mock user data
      mockQuery.single.mockResolvedValueOnce({
        data: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          created_at: '2020-01-01T00:00:00Z',
          experience_level: 'intermediate'
        }
      })

      // Mock wines data
      mockQuery.order.mockResolvedValueOnce({
        data: mockWines
      })

      const result = await dataExportService.exportUserData('user1', {
        format: 'json',
        includePersonalNotes: true
      })

      expect(result).toMatchObject({
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User'
        },
        wines: mockWines,
        exportDate: expect.any(String),
        version: '1.0'
      })
    })

    it('should exclude personal notes when not requested', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'user1', email: 'test@example.com' }
      })

      mockQuery.order.mockResolvedValueOnce({
        data: mockWines
      })

      const result = await dataExportService.exportUserData('user1', {
        format: 'json',
        includePersonalNotes: false
      })

      expect(result.wines[0].personal_notes).toBeUndefined()
      expect(result.wines[1].personal_notes).toBeUndefined()
    })

    it('should include taste profile when requested', async () => {
      mockQuery.single
        .mockResolvedValueOnce({
          data: { id: 'user1', email: 'test@example.com' }
        })
        .mockResolvedValueOnce({
          data: {
            user_id: 'user1',
            preferences: { fruitiness: 7 },
            created_at: '2020-01-01T00:00:00Z'
          }
        })

      mockQuery.order.mockResolvedValueOnce({
        data: mockWines
      })

      const result = await dataExportService.exportUserData('user1', {
        format: 'json',
        includeTasteProfile: true
      })

      expect(result.tasteProfile).toBeDefined()
      expect(result.tasteProfile?.preferences).toEqual({ fruitiness: 7 })
    })
  })

  describe('exportToCSV', () => {
    it('should convert wines to CSV format', () => {
      const csv = dataExportService.exportToCSV(mockWines)
      
      expect(csv).toContain('Name,Producer,Vintage,Region')
      expect(csv).toContain('Château Margaux,Château Margaux,2015,Bordeaux')
      expect(csv).toContain('Dom Pérignon,Moët & Chandon,2012,Champagne')
    })

    it('should handle empty wine list', () => {
      const csv = dataExportService.exportToCSV([])
      expect(csv).toBe('')
    })

    it('should escape CSV values with commas', () => {
      const wineWithComma = [{
        ...mockWines[0],
        name: 'Wine, with comma',
        personal_notes: 'Notes with "quotes" and, commas'
      }]

      const csv = dataExportService.exportToCSV(wineWithComma as any)
      
      expect(csv).toContain('"Wine, with comma"')
      expect(csv).toContain('"Notes with ""quotes"" and, commas"')
    })
  })

  describe('exportToJSON', () => {
    it('should convert data to formatted JSON', () => {
      const exportData = {
        user: { id: 'user1' },
        wines: mockWines,
        exportDate: '2023-01-01T00:00:00Z',
        version: '1.0'
      }

      const json = dataExportService.exportToJSON(exportData as any)
      const parsed = JSON.parse(json)

      expect(parsed).toEqual(exportData)
      expect(json).toContain('  ') // Should be formatted with indentation
    })
  })

  describe('createBackup', () => {
    it('should create complete backup with all data', async () => {
      mockQuery.single
        .mockResolvedValueOnce({
          data: { id: 'user1', email: 'test@example.com' }
        })
        .mockResolvedValueOnce({
          data: { user_id: 'user1', preferences: {} }
        })

      mockQuery.order
        .mockResolvedValueOnce({ data: mockWines })
        .mockResolvedValueOnce({ data: [] })

      const backup = await dataExportService.createBackup('user1')

      expect(backup.wines).toEqual(mockWines)
      expect(backup.tasteProfile).toBeDefined()
      expect(backup.consumptionHistory).toBeDefined()
    })
  })

  describe('restoreFromBackup', () => {
    it('should restore data from backup', async () => {
      const backupData = {
        user: { id: 'user1' },
        wines: mockWines,
        tasteProfile: { user_id: 'user1', preferences: {} },
        consumptionHistory: [],
        exportDate: '2023-01-01T00:00:00Z',
        version: '1.0'
      }

      // Mock successful operations
      const mockDeleteQuery = {
        eq: vi.fn().mockResolvedValue({ error: null })
      }
      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      }
      const mockUpsertQuery = {
        upsert: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabase.from
        .mockReturnValueOnce({ delete: vi.fn().mockReturnValue(mockDeleteQuery) })
        .mockReturnValueOnce(mockInsertQuery)
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({ delete: vi.fn().mockReturnValue(mockDeleteQuery) })
        .mockReturnValueOnce(mockInsertQuery)

      await expect(
        dataExportService.restoreFromBackup('user1', backupData as any)
      ).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
    })

    it('should handle invalid backup data', async () => {
      const invalidBackup = { wines: 'not-an-array' }

      await expect(
        dataExportService.restoreFromBackup('user1', invalidBackup as any)
      ).rejects.toThrow('Failed to restore data from backup')
    })
  })

  describe('deleteAllUserData', () => {
    it('should delete all user data', async () => {
      // Mock each table's delete operation
      const createMockDeleteQuery = () => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      mockSupabase.from
        .mockReturnValueOnce(createMockDeleteQuery()) // consumption_history
        .mockReturnValueOnce(createMockDeleteQuery()) // recommendations
        .mockReturnValueOnce(createMockDeleteQuery()) // notifications
        .mockReturnValueOnce(createMockDeleteQuery()) // taste_profiles
        .mockReturnValueOnce(createMockDeleteQuery()) // wines

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

      await expect(
        dataExportService.deleteAllUserData('user1')
      ).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('consumption_history')
      expect(mockSupabase.from).toHaveBeenCalledWith('recommendations')
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.from).toHaveBeenCalledWith('taste_profiles')
      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user1')
    })
  })

  describe('getExportStats', () => {
    it('should return export statistics', async () => {
      // Mock the Promise.all results
      const mockWinesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }] })
      }
      
      const mockHistoryQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: '1' }] })
      }
      
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile1' } })
      }
      
      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { 
            created_at: '2020-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockWinesQuery)
        .mockReturnValueOnce(mockHistoryQuery)
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockUserQuery)

      const stats = await dataExportService.getExportStats('user1')

      expect(stats).toEqual({
        totalWines: 2,
        totalConsumptionRecords: 1,
        hasTasteProfile: true,
        accountCreated: '2020-01-01T00:00:00Z',
        lastActivity: '2023-01-01T00:00:00Z'
      })
    })
  })
})