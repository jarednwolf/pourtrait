import { Wine, Notification, NotificationSettings } from '@/types'
import { DrinkingWindowService } from './drinking-window'
import { supabase } from '@/lib/supabase'

export interface DrinkingWindowAlert {
  type: 'entering_peak' | 'leaving_peak' | 'over_hill' | 'ready_to_drink'
  wine: Wine
  message: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  daysUntil?: number
}

/**
 * Service for managing drinking window notifications and alerts
 */
export class NotificationService {
  /**
   * Generate drinking window alerts for a user's wine collection
   */
  static async generateDrinkingWindowAlerts(
    _userId: string,
    wines: Wine[],
    settings: NotificationSettings
  ): Promise<DrinkingWindowAlert[]> {
    if (!settings.drinkingWindowAlerts) {
      return []
    }
    
    const alerts: DrinkingWindowAlert[] = []
    const { enteringPeak, leavingPeak, overHill } = DrinkingWindowService.getWinesNeedingAlerts(wines)
    
    // Wines entering peak window
    enteringPeak.forEach(wine => {
      const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      const daysUntil = Math.ceil(
        (new Date(wine.drinkingWindow.peakStartDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      alerts.push({
        type: 'entering_peak',
        wine,
        message: `${wine.name} (${wine.vintage}) will enter its peak drinking window in ${daysUntil} days. Consider planning to enjoy this wine soon.`,
        urgency: urgencyScore >= 60 ? 'high' : 'medium',
        daysUntil
      })
    })
    
    // Wines leaving peak window
    leavingPeak.forEach(wine => {
      const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      const daysUntil = Math.ceil(
        (new Date(wine.drinkingWindow.peakEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      alerts.push({
        type: 'leaving_peak',
        wine,
        message: `${wine.name} (${wine.vintage}) will leave its peak drinking window in ${daysUntil} days. This is an excellent time to enjoy this wine.`,
        urgency: urgencyScore >= 80 ? 'critical' : 'high',
        daysUntil
      })
    })
    
    // Wines past their prime
    overHill.forEach(wine => {
      alerts.push({
        type: 'over_hill',
        wine,
        message: `${wine.name} (${wine.vintage}) is past its optimal drinking window. While it may still be enjoyable, consider consuming it soon or using it for cooking.`,
        urgency: 'critical'
      })
    })
    
    // Sort by urgency and limit to most important alerts
    return alerts
      .sort((a, b) => this.getUrgencyWeight(b.urgency) - this.getUrgencyWeight(a.urgency))
      .slice(0, 10) // Limit to top 10 alerts to avoid overwhelming users
  }
  
  /**
   * Create notification in database
   */
  static async createNotification(
    userId: string,
    alert: DrinkingWindowAlert
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'drinking_window',
        title: this.getAlertTitle(alert),
        message: alert.message,
        data: {
          wineId: alert.wine.id,
          alertType: alert.type,
          urgency: alert.urgency,
          daysUntil: alert.daysUntil
        }
      })
    
    if (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }
  
  /**
   * Send email notification for high priority alerts
   */
  static async sendEmailAlert(
    _userEmail: string,
    alerts: DrinkingWindowAlert[]
  ): Promise<void> {
    const highPriorityAlerts = alerts.filter(alert => 
      alert.urgency === 'critical' || alert.urgency === 'high'
    )
    
    if (highPriorityAlerts.length === 0) {
      return
    }
    
    // This would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just log the email content
    const emailContent = this.generateEmailContent(highPriorityAlerts)
    console.log('Email alert would be sent:', emailContent)
    
    // TODO: Implement actual email sending
    // await emailService.send({
    //   to: userEmail,
    //   subject: emailContent.subject,
    //   html: emailContent.html
    // })
  }
  
  /**
   * Process drinking window alerts for all users (for scheduled jobs)
   */
  static async processAllUserAlerts(): Promise<void> {
    try {
      // Get all users with notification preferences
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          preferences,
          wines (*)
        `)
        .eq('preferences->notifications->drinkingWindowAlerts', true)
      
      if (usersError) {
        console.error('Failed to fetch users:', usersError)
        return
      }
      
      for (const user of users || []) {
        try {
          const rawWines = (user as any).wines || []
          const settings = ((user.preferences as any)?.notifications) || { drinkingWindowAlerts: true, recommendations: false, push: false, email: false }
          
          // Map DB wines to domain Wine[]
          const wines: Wine[] = rawWines.map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            name: w.name,
            producer: w.producer,
            vintage: w.vintage,
            region: w.region,
            country: w.country,
            varietal: w.varietal || [],
            type: w.type,
            quantity: w.quantity || 0,
            purchasePrice: w.purchase_price,
            purchaseDate: w.purchase_date ? new Date(w.purchase_date) : undefined,
            personalRating: w.personal_rating,
            personalNotes: w.personal_notes,
            imageUrl: w.image_url,
            drinkingWindow: w.drinking_window as any,
            externalData: w.external_data || {},
            createdAt: new Date(w.created_at),
            updatedAt: new Date(w.updated_at)
          }))
          
          const alerts = await this.generateDrinkingWindowAlerts(
            user.id,
            wines,
            settings
          )
          
          // Create notifications for each alert
          for (const alert of alerts) {
            await this.createNotification(user.id, alert)
          }
          
          // Send email for high priority alerts if email notifications enabled
          if (settings.email && alerts.length > 0) {
            const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
            if (authUser.user?.email) {
              await this.sendEmailAlert(authUser.user.email, alerts)
            }
          }
        } catch (error) {
          console.error(`Failed to process alerts for user ${user.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to process user alerts:', error)
    }
  }
  
  /**
   * Get unread drinking window notifications for a user
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'drinking_window')
      .eq('read', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
    
    // Map DB notifications to domain Notification type
    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type as 'drinking_window' | 'recommendation' | 'system',
      title: n.title,
      message: n.message,
      read: n.read ?? false,
      data: (n.data as Record<string, any>) ?? undefined,
      createdAt: new Date(n.created_at)
    }))
  }
  
  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    if (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }
  
  /**
   * Get urgency weight for sorting
   */
  private static getUrgencyWeight(urgency: DrinkingWindowAlert['urgency']): number {
    switch (urgency) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }
  
  /**
   * Generate alert title based on type
   */
  private static getAlertTitle(alert: DrinkingWindowAlert): string {
    switch (alert.type) {
      case 'entering_peak':
        return 'Wine Entering Peak Window'
      case 'leaving_peak':
        return 'Wine Leaving Peak Window'
      case 'over_hill':
        return 'Wine Past Optimal Window'
      case 'ready_to_drink':
        return 'Wine Ready to Drink'
      default:
        return 'Drinking Window Alert'
    }
  }
  
  /**
   * Generate email content for alerts
   */
  private static generateEmailContent(alerts: DrinkingWindowAlert[]): {
    subject: string
    html: string
  } {
    const criticalCount = alerts.filter(a => a.urgency === 'critical').length
    const highCount = alerts.filter(a => a.urgency === 'high').length
    
    let subject = 'Wine Drinking Window Alerts'
    if (criticalCount > 0) {
      subject = `${criticalCount} Critical Wine Alert${criticalCount > 1 ? 's' : ''}`
    } else if (highCount > 0) {
      subject = `${highCount} High Priority Wine Alert${highCount > 1 ? 's' : ''}`
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c2d12;">Wine Drinking Window Alerts</h2>
        <p>You have ${alerts.length} wine${alerts.length > 1 ? 's' : ''} that need your attention:</p>
        
        ${alerts.map(alert => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; background: ${this.getAlertBackgroundColor(alert.urgency)};">
            <h3 style="margin: 0 0 8px 0; color: #374151;">${alert.wine.name} (${alert.wine.vintage})</h3>
            <p style="margin: 0; color: #6b7280;">${alert.message}</p>
            ${alert.daysUntil ? `<p style="margin: 8px 0 0 0; font-weight: bold; color: #7c2d12;">Days until change: ${alert.daysUntil}</p>` : ''}
          </div>
        `).join('')}
        
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          You can manage your notification preferences in your account settings.
        </p>
      </div>
    `
    
    return { subject, html }
  }
  
  /**
   * Get background color for email alerts
   */
  private static getAlertBackgroundColor(urgency: DrinkingWindowAlert['urgency']): string {
    switch (urgency) {
      case 'critical': return '#fef2f2'
      case 'high': return '#fff7ed'
      case 'medium': return '#fefce8'
      case 'low': return '#f9fafb'
      default: return '#f9fafb'
    }
  }
}



