import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '../notification-service'
import { Wine, NotificationSettings } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    auth: {
      admin: {
        getUserById: vi.fn(() => Promise.resolve({ 
          data: { user: { email: 'test@example.com' } } 
        }))
      }
    }
  }
}))

// Mock DrinkingWindowService
vi.mock('../drinking-window', () => ({
  DrinkingWindowService: {
    getWinesNeedingAlerts: vi.fn(),
    getDrinkingUrgencyScore: vi.fn()
  }
}))

describe('NotificationService', () => {
  const mockSettings: NotificationSettings = {
    drinkingWindowAlerts: true,
    recommendations: true,
    email: true,
    push: false
  }

  const createMockWine = (id: string, name: string, vintage: number): Wine => ({
    id,
    userId: 'user1',
    name,
    producer: 'Test Producer',
    vintage,
    region: 'Test Region',
    country: 'Test Country',
    varietal: ['Cabernet Sauvignon'],
    type: 'red',
    quantity: 1,
    drinkingWindow: {
      earliestDate: new Date('2020-01-01'),
      peakStartDate: new Date('2025-01-01'),
      peakEndDate: new Date('2028-12-31'),
      latestDate: new Date('2030-12-31'),
      currentStatus: 'ready'
    },
    externalData: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateDrinkingWindowAlerts', () => {
    it('should return empty array when notifications disabled', async () => {
      const disabledSettings = { ...mockSettings, drinkingWindowAlerts: false }
      const wines = [createMockWine('1', 'Test Wine', 2020)]
      
      const alerts = await NotificationService.generateDrinkingWindowAlerts(
        'user1',
        wines,
        disabledSettings
      )
      
      expect(alerts).toEqual([])
    })

    it('should generate alerts for wines entering peak', async () => {
      const { DrinkingWindowService } = await import('../drinking-window')
      
      const wines = [
        createMockWine('1', 'Wine Entering Peak', 2020),
        createMockWine('2', 'Wine Leaving Peak', 2018)
      ]
      
      vi.mocked(DrinkingWindowService.getWinesNeedingAlerts).mockReturnValue({
        enteringPeak: [wines[0]],
        leavingPeak: [wines[1]],
        overHill: []
      })
      
      vi.mocked(DrinkingWindowService.getDrinkingUrgencyScore)
        .mockReturnValueOnce(50) // Medium urgency for entering peak
        .mockReturnValueOnce(80) // High urgency for leaving peak
      
      const alerts = await NotificationService.generateDrinkingWindowAlerts(
        'user1',
        wines,
        mockSettings
      )
      
      expect(alerts).toHaveLength(2)
      expect(alerts[0].type).toBe('leaving_peak') // Higher urgency first
      expect(alerts[0].urgency).toBe('critical')
      expect(alerts[1].type).toBe('entering_peak')
      expect(alerts[1].urgency).toBe('medium')
    })

    it('should limit alerts to top 10', async () => {
      const { DrinkingWindowService } = await import('../drinking-window')
      
      const wines = Array.from({ length: 15 }, (_, i) => 
        createMockWine(`wine-${i}`, `Wine ${i}`, 2020)
      )
      
      vi.mocked(DrinkingWindowService.getWinesNeedingAlerts).mockReturnValue({
        enteringPeak: wines,
        leavingPeak: [],
        overHill: []
      })
      
      vi.mocked(DrinkingWindowService.getDrinkingUrgencyScore).mockReturnValue(60)
      
      const alerts = await NotificationService.generateDrinkingWindowAlerts(
        'user1',
        wines,
        mockSettings
      )
      
      expect(alerts).toHaveLength(10)
    })

    it('should generate appropriate messages for different alert types', async () => {
      const { DrinkingWindowService } = await import('../drinking-window')
      
      const wines = [
        createMockWine('1', 'Entering Peak Wine', 2020),
        createMockWine('2', 'Leaving Peak Wine', 2018),
        createMockWine('3', 'Over Hill Wine', 2015)
      ]
      
      vi.mocked(DrinkingWindowService.getWinesNeedingAlerts).mockReturnValue({
        enteringPeak: [wines[0]],
        leavingPeak: [wines[1]],
        overHill: [wines[2]]
      })
      
      vi.mocked(DrinkingWindowService.getDrinkingUrgencyScore).mockReturnValue(70)
      
      const alerts = await NotificationService.generateDrinkingWindowAlerts(
        'user1',
        wines,
        mockSettings
      )
      
      // Find alerts by type since they're sorted by urgency
      const enteringPeakAlert = alerts.find(a => a.type === 'entering_peak')
      const leavingPeakAlert = alerts.find(a => a.type === 'leaving_peak')
      const overHillAlert = alerts.find(a => a.type === 'over_hill')
      
      expect(enteringPeakAlert?.message).toContain('will enter its peak drinking window')
      expect(leavingPeakAlert?.message).toContain('will leave its peak drinking window')
      expect(overHillAlert?.message).toContain('is past its optimal drinking window')
    })
  })

  describe('generateEmailContent', () => {
    it('should generate appropriate subject for critical alerts', () => {
      const alerts = [
        {
          type: 'over_hill' as const,
          wine: createMockWine('1', 'Critical Wine', 2015),
          message: 'Test message',
          urgency: 'critical' as const
        }
      ]
      
      const content = (NotificationService as any).generateEmailContent(alerts)
      
      expect(content.subject).toBe('1 Critical Wine Alert')
    })

    it('should generate appropriate subject for high priority alerts', () => {
      const alerts = [
        {
          type: 'leaving_peak' as const,
          wine: createMockWine('1', 'High Priority Wine', 2018),
          message: 'Test message',
          urgency: 'high' as const
        },
        {
          type: 'leaving_peak' as const,
          wine: createMockWine('2', 'Another High Priority Wine', 2018),
          message: 'Test message',
          urgency: 'high' as const
        }
      ]
      
      const content = (NotificationService as any).generateEmailContent(alerts)
      
      expect(content.subject).toBe('2 High Priority Wine Alerts')
    })

    it('should include wine details in HTML content', () => {
      const alerts = [
        {
          type: 'entering_peak' as const,
          wine: createMockWine('1', 'Test Wine', 2020),
          message: 'This wine will enter its peak window soon.',
          urgency: 'medium' as const,
          daysUntil: 5
        }
      ]
      
      const content = (NotificationService as any).generateEmailContent(alerts)
      
      expect(content.html).toContain('Test Wine (2020)')
      expect(content.html).toContain('This wine will enter its peak window soon.')
      expect(content.html).toContain('Days until change: 5')
    })
  })

  describe('getUrgencyWeight', () => {
    it('should return correct weights for urgency levels', () => {
      const getUrgencyWeight = (NotificationService as any).getUrgencyWeight
      
      expect(getUrgencyWeight('critical')).toBe(4)
      expect(getUrgencyWeight('high')).toBe(3)
      expect(getUrgencyWeight('medium')).toBe(2)
      expect(getUrgencyWeight('low')).toBe(1)
    })
  })

  describe('getAlertTitle', () => {
    it('should return appropriate titles for alert types', () => {
      const getAlertTitle = (NotificationService as any).getAlertTitle
      
      const enteringPeakAlert = {
        type: 'entering_peak',
        wine: createMockWine('1', 'Test', 2020),
        message: 'Test',
        urgency: 'medium'
      }
      
      const leavingPeakAlert = {
        type: 'leaving_peak',
        wine: createMockWine('1', 'Test', 2020),
        message: 'Test',
        urgency: 'high'
      }
      
      const overHillAlert = {
        type: 'over_hill',
        wine: createMockWine('1', 'Test', 2020),
        message: 'Test',
        urgency: 'critical'
      }
      
      expect(getAlertTitle(enteringPeakAlert)).toBe('Wine Entering Peak Window')
      expect(getAlertTitle(leavingPeakAlert)).toBe('Wine Leaving Peak Window')
      expect(getAlertTitle(overHillAlert)).toBe('Wine Past Optimal Window')
    })
  })

  describe('getAlertBackgroundColor', () => {
    it('should return appropriate colors for urgency levels', () => {
      const getAlertBackgroundColor = (NotificationService as any).getAlertBackgroundColor
      
      expect(getAlertBackgroundColor('critical')).toBe('#fef2f2')
      expect(getAlertBackgroundColor('high')).toBe('#fff7ed')
      expect(getAlertBackgroundColor('medium')).toBe('#fefce8')
      expect(getAlertBackgroundColor('low')).toBe('#f9fafb')
    })
  })
})