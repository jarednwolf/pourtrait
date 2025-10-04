/**
 * Error tracking and performance monitoring for production deployment
 * Integrates with Sentry, custom error logging, and performance metrics
 */

import { analytics } from './analytics'
import { logger } from '@/lib/utils/logger'
import { createServerClient } from '@/lib/supabase'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error categories for better organization
export type ErrorCategory = 
  | 'authentication'
  | 'database'
  | 'ai_service'
  | 'image_processing'
  | 'api_external'
  | 'validation'
  | 'network'
  | 'unknown'

// Performance metric types
export type PerformanceMetricType = 
  | 'api_response_time'
  | 'database_query_time'
  | 'ai_processing_time'
  | 'image_processing_time'
  | 'page_load_time'
  | 'memory_usage'
  | 'cpu_usage'

// Error context interface
export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  url?: string
  method?: string
  statusCode?: number
  category?: ErrorCategory
  metadata?: Record<string, any>
}

// Performance context interface
export interface PerformanceContext {
  userId?: string
  sessionId?: string
  endpoint?: string
  operation?: string
  metadata?: Record<string, any>
}

// Error tracking service
export class ErrorTracker {
  private static instance: ErrorTracker
  private isProduction: boolean
  private sentryEnabled: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.sentryEnabled = !!process.env.SENTRY_DSN
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  /**
   * Track an error with full context and severity
   */
  async trackError(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : error
      const errorStack = error instanceof Error ? error.stack : undefined
      const timestamp = new Date()

      // Determine error category automatically if not provided
      if (!context.category) {
        context.category = this.categorizeError(errorMessage, context)
      }

      // Log to console in development
      if (!this.isProduction) {
        logger.error(`[${severity.toUpperCase()}] ${errorMessage}`, {
          stack: errorStack,
          context
        } as any)
      }

      // Send to Sentry if configured
      if (this.sentryEnabled && typeof window !== 'undefined' && window.Sentry) {
        this.sendToSentry(error, severity, context)
      }

      // Store in database for analysis
      await this.storeErrorInDatabase(errorMessage, errorStack, severity, context, timestamp)

      // Send to analytics service
      await analytics.trackError({
        error,
        context,
        userId: context.userId,
        severity
      })

      // Create alert for critical errors
      if (severity === 'critical') {
        await this.createCriticalAlert(errorMessage, context)
      }

      // Track error metrics
      await this.trackErrorMetrics(context.category || 'unknown', severity)

    } catch (trackingError) {
      // Don't let error tracking failures break the application
      logger.error('Failed to track error:', { trackingError } as any)
    }
  }

  /**
   * Track performance metrics with context
   */
  async trackPerformance(
    metricType: PerformanceMetricType,
    value: number,
    unit: 'ms' | 'bytes' | 'percentage' = 'ms',
    context: PerformanceContext = {}
  ): Promise<void> {
    try {
      const timestamp = new Date()

      // Store performance metric
      await analytics.trackPerformance({
        name: metricType,
        value,
        unit,
        timestamp,
        metadata: context
      })

      // Check for performance issues
      if (this.isPerformanceIssue(metricType, value)) {
        await this.trackError(
          `Performance issue: ${metricType} = ${value}${unit}`,
          this.getPerformanceSeverity(metricType, value),
          {
            ...context,
            category: 'network',
            metadata: {
              ...context.metadata,
              metric_type: metricType,
              metric_value: value,
              metric_unit: unit
            }
          }
        )
      }

    } catch (error) {
      logger.error('Failed to track performance:', { error } as any)
    }
  }

  /**
   * Track API response times and errors
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    context: ErrorContext = {}
  ): Promise<void> {
    try {
      // Track performance
      await this.trackPerformance(
        'api_response_time',
        responseTime,
        'ms',
        {
          endpoint,
          operation: `${method} ${endpoint}`,
          ...context
        }
      )

      // Track errors for non-2xx responses
      if (statusCode >= 400) {
        const severity = this.getHttpErrorSeverity(statusCode)
        await this.trackError(
          `API Error: ${method} ${endpoint} returned ${statusCode}`,
          severity,
          {
            ...context,
            method,
            statusCode,
            category: statusCode >= 500 ? 'api_external' : 'validation',
            metadata: {
              ...context.metadata,
              response_time: responseTime
            }
          }
        )
      }

      // Store API usage metrics
      const supabase = createServerClient()
      await supabase.from('api_usage_metrics').insert({
        endpoint,
        method,
        status_code: statusCode,
        response_time: responseTime,
        user_id: context.userId,
        timestamp: new Date(),
        user_agent: context.userAgent,
        request_size: context.metadata?.requestSize,
        response_size: context.metadata?.responseSize,
        error_message: statusCode >= 400 ? `HTTP ${statusCode}` : null
      })

    } catch (error) {
      logger.error('Failed to track API call:', { error } as any)
    }
  }

  /**
   * Track database query performance
   */
  async trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    context: PerformanceContext = {}
  ): Promise<void> {
    try {
      await this.trackPerformance(
        'database_query_time',
        duration,
        'ms',
        {
          ...context,
          operation: 'database_query',
          metadata: {
            ...context.metadata,
            query_type: this.extractQueryType(query),
            success
          }
        }
      )

      // Track slow queries
      if (duration > 1000) { // Queries taking more than 1 second
        await this.trackError(
          `Slow database query: ${duration}ms`,
          duration > 5000 ? 'high' : 'medium',
          {
            userId: context.userId,
            category: 'database',
            metadata: {
              ...context.metadata,
              query_duration: duration,
              query_type: this.extractQueryType(query)
            }
          }
        )
      }

      // Track failed queries
      if (!success) {
        await this.trackError(
          'Database query failed',
          'high',
          {
            userId: context.userId,
            category: 'database',
            metadata: {
              ...context.metadata,
              query_duration: duration,
              query_type: this.extractQueryType(query)
            }
          }
        )
      }

    } catch (error) {
      logger.error('Failed to track database query:', { error } as any)
    }
  }

  /**
   * Track AI service performance and errors
   */
  async trackAIService(
    operation: string,
    duration: number,
    success: boolean,
    context: PerformanceContext = {}
  ): Promise<void> {
    try {
      await this.trackPerformance(
        'ai_processing_time',
        duration,
        'ms',
        {
          ...context,
          operation: `ai_${operation}`,
          metadata: {
            ...context.metadata,
            ai_operation: operation,
            success
          }
        }
      )

      // Track AI service errors
      if (!success) {
        await this.trackError(
          `AI service error: ${operation}`,
          'high',
          {
            userId: context.userId,
            category: 'ai_service',
            metadata: {
              ...context.metadata,
              operation,
              duration
            }
          }
        )
      }

      // Track slow AI responses
      if (duration > 30000) { // AI taking more than 30 seconds
        await this.trackError(
          `Slow AI response: ${operation} took ${duration}ms`,
          'medium',
          {
            userId: context.userId,
            category: 'ai_service',
            metadata: {
              ...context.metadata,
              operation,
              duration
            }
          }
        )
      }

    } catch (error) {
      logger.error('Failed to track AI service:', { error } as any)
    }
  }

  /**
   * Get error statistics for monitoring dashboard
   */
  async getErrorStatistics(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<{
    totalErrors: number
    errorsBySeverity: Record<ErrorSeverity, number>
    errorsByCategory: Record<ErrorCategory, number>
    errorTrends: Array<{ hour: string; count: number }>
    topErrors: Array<{ message: string; count: number }>
  }> {
    try {
      const supabase = createServerClient()
      const timeFilter = this.getTimeFilter(timeRange)

      // Get total errors
      const { count: totalErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeFilter)

      // Get errors by severity
      const { data: severityData } = await supabase
        .from('error_logs')
        .select('severity')
        .gte('timestamp', timeFilter)

      const errorsBySeverity = severityData?.reduce((acc, row) => {
        acc[row.severity as ErrorSeverity] = (acc[row.severity as ErrorSeverity] || 0) + 1
        return acc
      }, {} as Record<ErrorSeverity, number>) || {}

      // Get errors by category (from context metadata)
      const { data: categoryData } = await supabase
        .from('error_logs')
        .select('context')
        .gte('timestamp', timeFilter)

      const errorsByCategory = categoryData?.reduce((acc, row) => {
        const category = row.context?.category || 'unknown'
        acc[category as ErrorCategory] = (acc[category as ErrorCategory] || 0) + 1
        return acc
      }, {} as Record<ErrorCategory, number>) || {}

      // Get error trends (hourly)
      const { data: trendData } = await supabase
        .rpc('get_error_trends', { time_window: timeRange })

      const errorTrends = trendData || []

      // Get top error messages
      const { data: topErrorsData } = await supabase
        .rpc('get_top_errors', { time_window: timeRange, limit_count: 10 })

      const topErrors = topErrorsData || []

      return {
        totalErrors: totalErrors || 0,
        errorsBySeverity,
        errorsByCategory,
        errorTrends,
        topErrors
      }

    } catch (error) {
      logger.error('Failed to get error statistics:', { error } as any)
      return {
        totalErrors: 0,
        errorsBySeverity: {},
        errorsByCategory: {},
        errorTrends: [],
        topErrors: []
      }
    }
  }

  // Private helper methods

  private categorizeError(message: string, context: ErrorContext): ErrorCategory {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('auth') || lowerMessage.includes('login') || lowerMessage.includes('token')) {
      return 'authentication'
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sql') || lowerMessage.includes('supabase')) {
      return 'database'
    }
    if (lowerMessage.includes('openai') || lowerMessage.includes('ai') || lowerMessage.includes('gpt')) {
      return 'ai_service'
    }
    if (lowerMessage.includes('image') || lowerMessage.includes('vision') || lowerMessage.includes('ocr')) {
      return 'image_processing'
    }
    if (lowerMessage.includes('api') || lowerMessage.includes('fetch') || lowerMessage.includes('request')) {
      return 'api_external'
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || context.statusCode === 400) {
      return 'validation'
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout') || lowerMessage.includes('connection')) {
      return 'network'
    }
    
    return 'unknown'
  }

  private sendToSentry(error: Error | string, severity: ErrorSeverity, context: ErrorContext): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        level: this.mapSeverityToSentryLevel(severity),
        tags: {
          category: context.category,
          environment: process.env.VERCEL_ENV || 'development'
        },
        user: context.userId ? { id: context.userId } : undefined,
        contexts: {
          custom: context
        }
      })
    }
  }

  private async storeErrorInDatabase(
    message: string,
    stack: string | undefined,
    severity: ErrorSeverity,
    context: ErrorContext,
    timestamp: Date
  ): Promise<void> {
    const supabase = createServerClient()
    await supabase.from('error_logs').insert({
      message,
      stack,
      severity,
      context,
      user_id: context.userId,
      timestamp,
      environment: process.env.VERCEL_ENV || 'development'
    })
  }

  private async createCriticalAlert(message: string, context: ErrorContext): Promise<void> {
    const supabase = createServerClient()
    await supabase.from('alerts').insert({
      type: 'error',
      severity: 'critical',
      message: `Critical Error: ${message}`,
      data: context,
      timestamp: new Date()
    })
  }

  private async trackErrorMetrics(category: ErrorCategory, severity: ErrorSeverity): Promise<void> {
    await analytics.trackWineMetrics({
      [`errors_${category}`]: 1,
      [`errors_${severity}`]: 1
    })
  }

  private isPerformanceIssue(metricType: PerformanceMetricType, value: number): boolean {
    const thresholds = {
      'api_response_time': 5000, // 5 seconds
      'database_query_time': 3000, // 3 seconds
      'ai_processing_time': 30000, // 30 seconds
      'image_processing_time': 15000, // 15 seconds
      'page_load_time': 3000, // 3 seconds
      'memory_usage': 85, // 85%
      'cpu_usage': 90 // 90%
    }

    const threshold = thresholds[metricType]
    return threshold !== undefined && value > threshold
  }

  private getPerformanceSeverity(metricType: PerformanceMetricType, value: number): ErrorSeverity {
    const criticalThresholds = {
      'api_response_time': 10000, // 10 seconds
      'database_query_time': 5000, // 5 seconds
      'ai_processing_time': 60000, // 60 seconds
      'image_processing_time': 30000, // 30 seconds
      'page_load_time': 5000, // 5 seconds
      'memory_usage': 95, // 95%
      'cpu_usage': 95 // 95%
    }

    const criticalThreshold = criticalThresholds[metricType]
    if (criticalThreshold !== undefined && value > criticalThreshold) {
      return 'critical'
    }

    return 'medium'
  }

  private getHttpErrorSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) {return 'high'}
    if (statusCode === 429) {return 'medium'} // Rate limiting
    if (statusCode === 401 || statusCode === 403) {return 'medium'} // Auth issues
    return 'low' // Client errors
  }

  private extractQueryType(query: string): string {
    const lowerQuery = query.toLowerCase().trim()
    if (lowerQuery.startsWith('select')) {return 'SELECT'}
    if (lowerQuery.startsWith('insert')) {return 'INSERT'}
    if (lowerQuery.startsWith('update')) {return 'UPDATE'}
    if (lowerQuery.startsWith('delete')) {return 'DELETE'}
    if (lowerQuery.startsWith('create')) {return 'CREATE'}
    if (lowerQuery.startsWith('alter')) {return 'ALTER'}
    return 'OTHER'
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): string {
    const mapping = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error',
      'critical': 'fatal'
    }
    return mapping[severity]
  }

  private getTimeFilter(timeRange: string): string {
    const now = new Date()
    const filters = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
    return filters[timeRange as keyof typeof filters].toISOString()
  }
}

// Convenience functions for common error tracking
export const errorTracker = ErrorTracker.getInstance()

export const trackApiError = (
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  context?: ErrorContext
) => {
  errorTracker.trackApiCall(endpoint, method, statusCode, responseTime, context)
}

export const trackDatabaseError = (
  query: string,
  duration: number,
  success: boolean,
  context?: PerformanceContext
) => {
  errorTracker.trackDatabaseQuery(query, duration, success, context)
}

export const trackAIError = (
  operation: string,
  duration: number,
  success: boolean,
  context?: PerformanceContext
) => {
  errorTracker.trackAIService(operation, duration, success, context)
}

export const trackCriticalError = (error: Error | string, context?: ErrorContext) => {
  errorTracker.trackError(error, 'critical', context)
}

export const trackError = (
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context?: ErrorContext
) => {
  errorTracker.trackError(error, severity, context)
}

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, 'high', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, 'high', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        type: 'unhandled_promise_rejection'
      }
    })
  })
}

// Declare global Sentry type
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: any, context?: any) => void
    }
  }
}