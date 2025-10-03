import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WineService } from '@/lib/services/wine-service'
import { supabase } from '@/lib/supabase'
import type { WineInput } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            // Add more chaining methods as needed
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

describe('WineService', () => {
  const mockUserId = 'test-user-id'
  const mockWineData: WineInput = {
    name: 'Test Wine',
    producer: 'Test Producer',
    vintage: 2020,
    region: 'Test Region',
    country: 'Test Country',
    varietal: ['Cabernet Sauvignon'],
    type: 'red',
    quantity: 1,
    purchasePrice: 25.99,
    personalNotes: 'Test notes'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addWine', () => {
    it('should add a wine successfully', async () => {
      const mockWine = { id: 'wine-id', ...mockWineData, user_id: mockUserId }
      
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockWine, error: null })
        }))
      }))
      
      const mockFrom = vi.fn(() => ({
        insert: mockInsert
      }))
      
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await WineService.addWine(mockUserId, mockWineData)
      
      expect(supabase.from).toHaveBeenCalledWith('wines')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUserId,
        name: mockWineData.name,
        producer: mockWineData.producer,
        vintage: mockWineData.vintage,
        region: mockWineData.region,
        country: mockWineData.country,
        varietal: mockWineData.varietal,
        type: mockWineData.type,
        quantity: mockWineData.quantity
      }))
    })

    it('should handle errors when adding wine fails', async () => {
      const mockError = new Error('Database error')
      
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError })
        }))
      }))
      
      const mockFrom = vi.fn(() => ({
        insert: mockInsert
      }))
      
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(WineService.addWine(mockUserId, mockWineData))
        .rejects.toThrow('Failed to add wine: Database error')
    })
  })

  describe('getInventory', () => {
    it('should fetch user inventory successfully', async () => {
      const mockWines = [
        { id: 'wine-1', name: 'Wine 1', user_id: mockUserId },
        { id: 'wine-2', name: 'Wine 2', user_id: mockUserId }
      ]

      const mockOrder = vi.fn().mockResolvedValue({ data: mockWines, error: null })
      const mockEq = vi.fn(() => ({ order: mockOrder }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      const mockFrom = vi.fn(() => ({ select: mockSelect }))
      
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await WineService.getInventory(mockUserId)
      
      expect(supabase.from).toHaveBeenCalledWith('wines')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId)
      expect(result).toEqual(mockWines)
    })
  })

  describe('updateWine', () => {
    it('should update wine successfully', async () => {
      const wineId = 'wine-id'
      const updates = { name: 'Updated Wine Name' }
      const mockUpdatedWine = { id: wineId, name: 'Updated Wine Name' }

      const mockSingle = vi.fn().mockResolvedValue({ data: mockUpdatedWine, error: null })
      const mockSelect = vi.fn(() => ({ single: mockSingle }))
      const mockEq = vi.fn(() => ({ select: mockSelect }))
      const mockUpdate = vi.fn(() => ({ eq: mockEq }))
      const mockFrom = vi.fn(() => ({ update: mockUpdate }))
      
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await WineService.updateWine(wineId, updates)
      
      expect(supabase.from).toHaveBeenCalledWith('wines')
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Wine Name' })
      expect(mockEq).toHaveBeenCalledWith('id', wineId)
      expect(result).toEqual(mockUpdatedWine)
    })
  })
})