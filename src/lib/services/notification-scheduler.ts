/**
 * Notification Scheduler Service
 * 
 * Handles scheduling, delivery tracking, and management of all notification types
 */

import { supabase } from '@/lib/supabase'
import { NotificationService, DrinkingWindowAlert } from './notification-service'
import { pushNotificationService, wineNotificationTemplates } from './push-notifications'

export interface ScheduledNotification {
  id: string
  userId: string
  type: 'drinking_window' | 'recommendation' | 'inventory_reminder' | 'system'
  scheduledFor: Date
  payload: NotificationPayload
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  attempts: number
  lastAttempt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPayload {
  title: string
  body: string
  data?: any
  actions?: NotificationAction[]
  icon?: string
  badge?: string
  image?: string
  tag?: string
  requireInteraction?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  drinkingWindowAlerts: boolean
  recommendationAlerts: boolean
  inventoryReminders: boolean
  systemAlerts: boolean
  quietHours?: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
  }
  frequency?: {
    drinkingWindow: 'immediate' | 'daily' | 'weekly'
    recommendations: 'immediate' | 'daily' | 'weekly'
    inventory: 'weekly' | 'monthly' | 'never'
  }
}

export class NotificationScheduler {
  /**
   * Schedule a notification for future delivery
   */
  static async scheduleNotification(
    userId: string,
    type: ScheduledNotification['type'],
    scheduledFor: Date,
    payload: NotificationPayload
  ): Promise<string> {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        type,
        scheduled_for: scheduledFor.toISOString(),
        payload: JSON.stringify(payload),
        status: 'pending',
        attempts: 0
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to schedule notification:', error)
      throw error
    }

    return data.id
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelScheduledNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Failed to cancel notification:', error)
      throw error
    }
  }

  /**
   * Process pending notifications (called by cron job)
   */
  static async processPendingNotifications(): Promise<void> {
    try {
      // Get all pending notifications that are due
      const { data: pendingNotifications, error } = await supabase
        .from('scheduled_notifications')
        .select(`
          *,
          user_profiles!inner(
            id,
            notification_preferences
          )
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(100) // Process in batches

      if (error) {
        console.error('Failed to fetch pending notifications:', error)
        return
      }

      for (const notification of pendingNotifications || []) {
        await this.deliverNotification(notification)
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error)
    }
  }

  /**
   * Deliver a single notification
   */
  private static async deliverNotification(notification: any): Promise<void> {
    try {
      const preferences = notification.user_profiles?.notification_preferences || {}
      const payload = JSON.parse(notification.payload)

      // Check if user has opted out of this notification type
      if (!this.shouldDeliverNotification(notification.type, preferences)) {
        await this.markNotificationStatus(notification.id, 'cancelled')
        return
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences.quietHours)) {
        // Reschedule for after quiet hours
        const nextDeliveryTime = this.getNextDeliveryTime(preferences.quietHours)
        await this.rescheduleNotification(notification.id, nextDeliveryTime)
        return
      }

      let deliverySuccess = false
      const deliveryResults: any[] = []

      // Send push notification if enabled
      if (preferences.pushEnabled !== false) {
        try {
          // Send push notification via API endpoint
          const pushResponse = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.PUSH_API_KEY || ''
            },
            body: JSON.stringify({
              userId: notification.user_id,
              payload
            })
          })
          
          const pushResult = await pushResponse.json()
          deliveryResults.push({ type: 'push', success: pushResult.success })
          if (pushResult.success && pushResult.sent > 0) {
            deliverySuccess = true
          }
        } catch (error) {
          console.error('Push notification failed:', error)
          deliveryResults.push({ type: 'push', success: false, error: error.message })
        }
      }

      // Send email notification if enabled and it's a high priority alert
      if (preferences.emailEnabled && this.isHighPriorityAlert(notification.type, payload)) {
        try {
          // This would integrate with your email service
          // For now, we'll just log it
          console.log('Email notification would be sent:', {
            userId: notification.user_id,
            type: notification.type,
            payload
          })
          deliveryResults.push({ type: 'email', success: true })
          deliverySuccess = true
        } catch (error) {
          console.error('Email notification failed:', error)
          deliveryResults.push({ type: 'email', success: false, error: error.message })
        }
      }

      // Create in-app notification record
      try {
        await NotificationService.createNotification(notification.user_id, {
          type: notification.type === 'drinking_window' ? 'entering_peak' : 'ready_to_drink',
          wine: payload.data?.wine || {},
          message: payload.body,
          urgency: payload.data?.urgency || 'medium'
        })
        deliveryResults.push({ type: 'in_app', success: true })
        deliverySuccess = true
      } catch (error) {
        console.error('In-app notification failed:', error)
        deliveryResults.push({ type: 'in_app', success: false, error: error.message })
      }

      // Log delivery attempt
      await this.logDeliveryAttempt(
        notification.id,
        deliverySuccess ? 'sent' : 'failed',
        deliveryResults
      )

      // Update notification status
      await this.markNotificationStatus(
        notification.id,
        deliverySuccess ? 'sent' : 'failed'
      )

    } catch (error) {
      console.error('Error delivering notification:', error)
      await this.logDeliveryAttempt(notification.id, 'failed', [
        { type: 'system', success: false, error: error.message }
      ])
      await this.markNotificationStatus(notification.id, 'failed')
    }
  }

  /**
   * Check if notification should be delivered based on user preferences
   */
  private static shouldDeliverNotification(
    type: string,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'drinking_window':
        return preferences.drinkingWindowAlerts !== false
      case 'recommendation':
        return preferences.recommendationAlerts !== false
      case 'inventory_reminder':
        return preferences.inventoryReminders !== false
      case 'system':
        return preferences.systemAlerts !== false
      default:
        return true
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isInQuietHours(quietHours?: NotificationPreferences['quietHours']): boolean {
    if (!quietHours?.enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number)
    const [endHour, endMin] = quietHours.end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  /**
   * Get next delivery time after quiet hours
   */
  private static getNextDeliveryTime(quietHours: NotificationPreferences['quietHours']): Date {
    if (!quietHours?.enabled) return new Date()

    const now = new Date()
    const [endHour, endMin] = quietHours.end.split(':').map(Number)
    
    const nextDelivery = new Date(now)
    nextDelivery.setHours(endHour, endMin, 0, 0)
    
    // If end time is earlier in the day, it means next day
    if (nextDelivery <= now) {
      nextDelivery.setDate(nextDelivery.getDate() + 1)
    }
    
    return nextDelivery
  }

  /**
   * Check if notification is high priority and should trigger email
   */
  private static isHighPriorityAlert(type: string, payload: NotificationPayload): boolean {
    if (type === 'drinking_window') {
      const urgency = payload.data?.urgency
      return urgency === 'critical' || urgency === 'high'
    }
    return type === 'system'
  }

  /**
   * Reschedule a notification for later delivery
   */
  private static async rescheduleNotification(notificationId: string, newTime: Date): Promise<void> {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        scheduled_for: newTime.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Failed to reschedule notification:', error)
    }
  }

  /**
   * Mark notification status
   */
  private static async markNotificationStatus(
    notificationId: string,
    status: 'sent' | 'failed' | 'cancelled'
  ): Promise<void> {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({
        status,
        last_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Failed to update notification status:', error)
    }
  }

  /**
   * Log delivery attempt for tracking
   */
  private static async logDeliveryAttempt(
    notificationId: string,
    status: 'sent' | 'failed',
    results: any[]
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_delivery_logs')
      .insert({
        scheduled_notification_id: notificationId,
        delivery_status: status,
        delivery_channels: results,
        attempted_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log delivery attempt:', error)
    }
  }

  /**
   * Schedule drinking window alerts for a user
   */
  static async scheduleDrinkingWindowAlerts(
    userId: string,
    wines: any[],
    preferences: NotificationPreferences
  ): Promise<void> {
    if (!preferences.drinkingWindowAlerts) return

    const alerts = await NotificationService.generateDrinkingWindowAlerts(
      userId,
      wines,
      { drinkingWindowAlerts: true, email: preferences.emailEnabled }
    )

    for (const alert of alerts) {
      const scheduledFor = this.calculateScheduleTime(alert, preferences)
      
      const payload: NotificationPayload = {
        title: wineNotificationTemplates.drinkingWindow(alert.wine.name, alert.type).title,
        body: alert.message,
        data: {
          type: 'drinking_window',
          wineId: alert.wine.id,
          urgency: alert.urgency,
          wine: alert.wine
        },
        tag: `drinking-window-${alert.wine.id}`,
        requireInteraction: alert.urgency === 'critical'
      }

      await this.scheduleNotification(userId, 'drinking_window', scheduledFor, payload)
    }
  }

  /**
   * Calculate when to schedule notification based on preferences
   */
  private static calculateScheduleTime(
    alert: DrinkingWindowAlert,
    preferences: NotificationPreferences
  ): Date {
    const now = new Date()
    const frequency = preferences.frequency?.drinkingWindow || 'immediate'

    switch (frequency) {
      case 'immediate':
        return now
      case 'daily':
        // Schedule for next 9 AM
        const tomorrow9AM = new Date(now)
        tomorrow9AM.setDate(tomorrow9AM.getDate() + 1)
        tomorrow9AM.setHours(9, 0, 0, 0)
        return tomorrow9AM
      case 'weekly':
        // Schedule for next Monday 9 AM
        const nextMonday = new Date(now)
        const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
        nextMonday.setHours(9, 0, 0, 0)
        return nextMonday
      default:
        return now
    }
  }

  /**
   * Get notification history for a user
   */
  static async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    notifications: any[]
    total: number
  }> {
    const { data, error, count } = await supabase
      .from('scheduled_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch notification history:', error)
      throw error
    }

    return {
      notifications: data || [],
      total: count || 0
    }
  }

  /**
   * Get notification delivery statistics
   */
  static async getDeliveryStats(userId: string): Promise<{
    total: number
    sent: number
    failed: number
    pending: number
    cancelled: number
  }> {
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('status')
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to fetch delivery stats:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      sent: 0,
      failed: 0,
      pending: 0,
      cancelled: 0
    }

    data?.forEach(notification => {
      stats[notification.status as keyof typeof stats]++
    })

    return stats
  }
}