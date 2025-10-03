import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationScheduler } from '../notification-scheduler'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'test-id' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ 
              data: [], 
              error: null 
            }))
          }))
        }))
      }))
    }))
  }
}))

describe('NotificationScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleNotification', () => {
    it('should schedule a notification successfully', async () => {
      const userId = 'user-123'
      const type = 'drinking_window'
      const scheduledFor = new Date('2024-01-01T10:00:00Z')
      const payload = {
        title: 'Test Notification',
        body: 'Test message'
      }

      const notificationId = await NotificationScheduler.scheduleNotification(
        userId,
        type,
        scheduledFor,
        payload
      )

      expect(notificationId).toBe('test-id')
    })
  })

  describe('shouldDeliverNotification', () => {
    it('should respect user preferences for drinking window alerts', () => {
      const preferences = {
        pushEnabled: true,
        emailEnabled: true,
        drinkingWindowAlerts: false,
        recommendationAlerts: true,
        inventoryReminders: true,
        systemAlerts: true
      }

      // Access private method through type assertion
      const shouldDeliver = (NotificationScheduler as any).shouldDeliverNotification(
        'drinking_window',
        preferences
      )

      expect(shouldDeliver).toBe(false)
    })

    it('should allow notifications when preferences are enabled', () => {
      const preferences = {
        pushEnabled: true,
        emailEnabled: true,
        drinkingWindowAlerts: true,
        recommendationAlerts: true,
        inventoryReminders: true,
        systemAlerts: true
      }

      const shouldDeliver = (NotificationScheduler as any).shouldDeliverNotification(
        'drinking_window',
        preferences
      )

      expect(shouldDeliver).toBe(true)
    })
  })

  describe('isInQuietHours', () => {
    it('should return false when quiet hours are disabled', () => {
      const quietHours = {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }

      const isQuiet = (NotificationScheduler as any).isInQuietHours(quietHours)
      expect(isQuiet).toBe(false)
    })

    it('should detect quiet hours correctly for same-day range', () => {
      // Mock Date constructor and getHours/getMinutes methods
      const originalDate = global.Date
      const mockDate = {
        getHours: () => 23,
        getMinutes: () => 0
      }
      
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const quietHours = {
        enabled: true,
        start: '22:00',
        end: '23:30'
      }

      const isQuiet = (NotificationScheduler as any).isInQuietHours(quietHours)
      expect(isQuiet).toBe(true)

      global.Date = originalDate
    })
  })

  describe('calculateScheduleTime', () => {
    it('should return immediate time for immediate frequency', () => {
      const alert = {
        type: 'entering_peak' as const,
        wine: { id: 'wine-1', name: 'Test Wine' },
        message: 'Test message',
        urgency: 'medium' as const
      }

      const preferences = {
        frequency: {
          drinkingWindow: 'immediate' as const,
          recommendations: 'daily' as const,
          inventory: 'weekly' as const
        }
      }

      const scheduledTime = (NotificationScheduler as any).calculateScheduleTime(
        alert,
        preferences
      )

      // Should be very close to now (within 1 second)
      const now = new Date()
      const timeDiff = Math.abs(scheduledTime.getTime() - now.getTime())
      expect(timeDiff).toBeLessThan(1000)
    })

    it('should schedule for next day at 9 AM for daily frequency', () => {
      const alert = {
        type: 'entering_peak' as const,
        wine: { id: 'wine-1', name: 'Test Wine' },
        message: 'Test message',
        urgency: 'medium' as const
      }

      const preferences = {
        frequency: {
          drinkingWindow: 'daily' as const,
          recommendations: 'daily' as const,
          inventory: 'weekly' as const
        }
      }

      const scheduledTime = (NotificationScheduler as any).calculateScheduleTime(
        alert,
        preferences
      )

      expect(scheduledTime.getHours()).toBe(9)
      expect(scheduledTime.getMinutes()).toBe(0)
      
      // Should be at least tomorrow (check date is different)
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      expect(scheduledTime.getDate()).toBeGreaterThanOrEqual(tomorrow.getDate())
    })
  })

  describe('isHighPriorityAlert', () => {
    it('should identify critical drinking window alerts as high priority', () => {
      const payload = {
        title: 'Test',
        body: 'Test',
        data: { urgency: 'critical' }
      }

      const isHighPriority = (NotificationScheduler as any).isHighPriorityAlert(
        'drinking_window',
        payload
      )

      expect(isHighPriority).toBe(true)
    })

    it('should identify system alerts as high priority', () => {
      const payload = {
        title: 'Test',
        body: 'Test'
      }

      const isHighPriority = (NotificationScheduler as any).isHighPriorityAlert(
        'system',
        payload
      )

      expect(isHighPriority).toBe(true)
    })

    it('should not identify medium urgency alerts as high priority', () => {
      const payload = {
        title: 'Test',
        body: 'Test',
        data: { urgency: 'medium' }
      }

      const isHighPriority = (NotificationScheduler as any).isHighPriorityAlert(
        'drinking_window',
        payload
      )

      expect(isHighPriority).toBe(false)
    })
  })
})