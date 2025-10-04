/**
 * Analytics and monitoring service for production deployment
 * Integrates with Vercel Analytics, Supabase metrics, and custom tracking
 */

import { createServerClient } from '@/lib/supabase'

// Types for analytics events
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp?: Date
  metadata?: Record<string, any>
}

export interface ErrorEvent {
  error: Error | string
  context?: Record<string, any>
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Analytics service class
export class AnalyticsService {
  private static instance: AnalyticsService
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Track user events for business intelligence
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Only track in production or when explicitly enabled
      if (!this.isProduction && !process.env.ENABLE_ANALYTICS) {
        return
      }

      // Send to Vercel Analytics (Web Vitals and custom events)
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', event.name, event.properties)
      }

      // Store custom events in database for business analytics
      if (this.shouldStoreEvent(event.name)) {
        await this.storeEventInDatabase(event)
      }

      // Send to external analytics if configured
      await this.sendToExternalAnalytics(event)

    } catch (error) {
      console.error('Failed to track event:', error)
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      if (!this.isProduction) {return}

      // Store performance metrics in database
      const supabase = createServerClient()
      await supabase.from('performance_metrics').insert({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp || new Date(),
        metadata: metric.metadata || {}
      })

      // Send critical performance issues to monitoring
      if (this.isCriticalPerformanceIssue(metric)) {
        await this.alertCriticalPerformance(metric)
      }

    } catch (error) {
      console.error('Failed to track performance:', error)
    }
  }

  /**
   * Track errors and exceptions
   */
  async trackError(errorEvent: ErrorEvent): Promise<void> {
    try {
      const errorMessage = errorEvent.error instanceof Error 
        ? errorEvent.error.message 
        : String(errorEvent.error)

      const errorStack = errorEvent.error instanceof Error 
        ? errorEvent.error.stack 
        : undefined

      // Store error in database
      const supabase = createServerClient()
      await supabase.from('error_logs').insert({
        message: errorMessage,
        stack: errorStack,
        context: errorEvent.context || {},
        user_id: errorEvent.userId,
        severity: errorEvent.severity,
        timestamp: new Date(),
        environment: process.env.VERCEL_ENV || 'development'
      })

      // Send to external error tracking (Sentry, etc.)
      await this.sendErrorToExternalService(errorEvent)

      // Alert for critical errors
      if (errorEvent.severity === 'critical') {
        await this.alertCriticalError(errorEvent)
      }

    } catch (error) {
      console.error('Failed to track error:', error)
    }
  }

  /**
   * Track business metrics specific to wine app
   */
  async trackWineMetrics(metrics: {
    winesAdded?: number
    recommendationsGenerated?: number
    aiQueriesProcessed?: number
    imageProcessingRequests?: number
    userRegistrations?: number
  }): Promise<void> {
    try {
      if (!this.isProduction) {return}

      const supabase = createServerClient()
      
      // Store business metrics
      for (const [metricName, value] of Object.entries(metrics)) {
        if (value !== undefined) {
          await supabase.from('business_metrics').insert({
            metric_name: metricName,
            metric_value: value,
            timestamp: new Date(),
            environment: process.env.VERCEL_ENV
          })
        }
      }

    } catch (error) {
      console.error('Failed to track wine metrics:', error)
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    userActivity: any[]
    performanceMetrics: any[]
    errorRates: any[]
    businessMetrics: any[]
  }> {
    try {
      const supabase = createServerClient()
      const timeFilter = this.getTimeFilter(timeRange)

      // Get user activity metrics
      const { data: userActivity } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })

      // Get performance metrics
      const { data: performanceMetrics } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })

      // Get error rates
      const { data: errorRates } = await supabase
        .from('error_logs')
        .select('severity, timestamp')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })

      // Get business metrics
      const { data: businessMetrics } = await supabase
        .from('business_metrics')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })

      return {
        userActivity: userActivity || [],
        performanceMetrics: performanceMetrics || [],
        errorRates: errorRates || [],
        businessMetrics: businessMetrics || []
      }

    } catch (error) {
      console.error('Failed to get dashboard metrics:', error)
      return {
        userActivity: [],
        performanceMetrics: [],
        errorRates: [],
        businessMetrics: []
      }
    }
  }

  // Private helper methods

  private shouldStoreEvent(eventName: string): boolean {
    // Only store important business events
    const importantEvents = [
      'wine_added',
      'recommendation_generated',
      'ai_query_processed',
      'user_registered',
      'image_processed',
      'taste_profile_completed',
      'wine_consumed',
      'food_pairing_requested'
    ]
    return importantEvents.includes(eventName)
  }

  private async storeEventInDatabase(event: AnalyticsEvent): Promise<void> {
    const supabase = createServerClient()
    await supabase.from('analytics_events').insert({
      event_name: event.name,
      properties: event.properties || {},
      user_id: event.userId,
      timestamp: event.timestamp || new Date(),
      environment: process.env.VERCEL_ENV
    })
  }

  private async sendToExternalAnalytics(event: AnalyticsEvent): Promise<void> {
    // Implement external analytics integration (PostHog, Mixpanel, etc.)
    if (process.env.POSTHOG_API_KEY) {
      // PostHog integration example
      try {
        await fetch('https://app.posthog.com/capture/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: process.env.POSTHOG_API_KEY,
            event: event.name,
            properties: {
              ...event.properties,
              distinct_id: event.userId || 'anonymous',
              timestamp: event.timestamp || new Date()
            }
          })
        })
      } catch (error) {
        console.error('Failed to send to PostHog:', error)
      }
    }
  }

  private async sendErrorToExternalService(errorEvent: ErrorEvent): Promise<void> {
    // Sentry integration example
    if (process.env.SENTRY_DSN && typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(errorEvent.error, {
        contexts: {
          custom: errorEvent.context
        },
        user: errorEvent.userId ? { id: errorEvent.userId } : undefined,
        level: this.mapSeverityToSentryLevel(errorEvent.severity)
      })
    }
  }

  private isCriticalPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      'api_response_time': 5000, // 5 seconds
      'database_query_time': 3000, // 3 seconds
      'ai_processing_time': 30000, // 30 seconds
      'image_processing_time': 15000, // 15 seconds
      'memory_usage': 85, // 85%
      'cpu_usage': 90 // 90%
    }

    const threshold = thresholds[metric.name as keyof typeof thresholds]
    return threshold !== undefined && metric.value > threshold
  }

  private async alertCriticalPerformance(metric: PerformanceMetric): Promise<void> {
    // Send alert to monitoring service (PagerDuty, Slack, etc.)
    console.error(`Critical performance issue: ${metric.name} = ${metric.value}${metric.unit}`)
    
    // Store critical alert
    const supabase = createServerClient()
    await supabase.from('alerts').insert({
      type: 'performance',
      severity: 'critical',
      message: `Critical performance issue: ${metric.name} exceeded threshold`,
      data: metric,
      timestamp: new Date()
    })
  }

  private async alertCriticalError(errorEvent: ErrorEvent): Promise<void> {
    // Send critical error alert
    console.error('Critical error occurred:', errorEvent.error)
    
    const supabase = createServerClient()
    await supabase.from('alerts').insert({
      type: 'error',
      severity: 'critical',
      message: `Critical error: ${errorEvent.error}`,
      data: errorEvent.context,
      timestamp: new Date()
    })
  }

  private mapSeverityToSentryLevel(severity: string): string {
    const mapping = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error',
      'critical': 'fatal'
    }
    return mapping[severity as keyof typeof mapping] || 'error'
  }

  private getTimeFilter(timeRange: string): string {
    const now = new Date()
    const filters = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    return filters[timeRange as keyof typeof filters].toISOString()
  }
}

// Convenience functions for common tracking
export const analytics = AnalyticsService.getInstance()

export const trackWineAdded = (userId: string, wineData: any) => {
  analytics.trackEvent({
    name: 'wine_added',
    userId,
    properties: {
      wine_type: wineData.type,
      vintage: wineData.vintage,
      region: wineData.region
    }
  })
}

export const trackRecommendationGenerated = (userId: string, recommendationType: string) => {
  analytics.trackEvent({
    name: 'recommendation_generated',
    userId,
    properties: {
      type: recommendationType
    }
  })
}

export const trackAIQuery = (userId: string, queryType: string, responseTime: number) => {
  analytics.trackEvent({
    name: 'ai_query_processed',
    userId,
    properties: {
      query_type: queryType
    }
  })
  
  analytics.trackPerformance({
    name: 'ai_processing_time',
    value: responseTime,
    unit: 'ms',
    metadata: { query_type: queryType }
  })
}

export const trackImageProcessing = (userId: string, processingTime: number, success: boolean) => {
  analytics.trackEvent({
    name: 'image_processed',
    userId,
    properties: {
      success,
      processing_time: processingTime
    }
  })
  
  analytics.trackPerformance({
    name: 'image_processing_time',
    value: processingTime,
    unit: 'ms'
  })
}

export const trackError = (error: Error, context?: any, userId?: string, severity: ErrorEvent['severity'] = 'medium') => {
  analytics.trackError({
    error,
    context,
    userId,
    severity
  })
}

// Web Vitals tracking for Vercel Analytics
export const trackWebVitals = (metric: any) => {
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'Web Vitals', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta
    })
  }
  
  // Also store in our performance tracking
  analytics.trackPerformance({
    name: `web_vital_${metric.name.toLowerCase()}`,
    value: metric.value,
    unit: 'ms'
  })
}

// Declare global types for Vercel Analytics and Sentry
declare global {
  interface Window {
    va?: (command: string, eventName: string, properties?: any) => void
    Sentry?: {
      captureException: (error: any, context?: any) => void
    }
  }
}