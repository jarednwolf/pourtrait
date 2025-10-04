/**
 * Monitoring Dashboard API
 * Provides comprehensive monitoring data for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
// import { analytics } from '@/lib/monitoring/analytics'
import { errorTracker } from '@/lib/monitoring/error-tracking'

// Types for dashboard data
interface DashboardMetrics {
  systemHealth: SystemHealthMetrics
  performance: PerformanceMetrics
  errors: ErrorMetrics
  business: BusinessMetrics
  alerts: AlertMetrics
  uptime: UptimeMetrics
}

interface SystemHealthMetrics {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: ServiceStatus
    ai: ServiceStatus
    imageProcessing: ServiceStatus
    email: ServiceStatus
    storage: ServiceStatus
  }
  lastUpdated: string
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  errorRate?: number
  uptime?: number
  lastCheck: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  p95ResponseTime: number
  throughput: number
  activeUsers: number
  memoryUsage: number
  cpuUsage: number
}

interface ErrorMetrics {
  totalErrors: number
  errorRate: number
  criticalErrors: number
  errorsByCategory: Record<string, number>
  recentErrors: Array<{
    message: string
    severity: string
    timestamp: string
    count: number
  }>
}

interface BusinessMetrics {
  dailyActiveUsers: number
  winesAdded: number
  recommendationsGenerated: number
  aiQueriesProcessed: number
  imageProcessingRequests: number
  conversionRate: number
}

interface AlertMetrics {
  activeAlerts: number
  criticalAlerts: number
  recentAlerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    timestamp: string
  }>
}

interface UptimeMetrics {
  uptime24h: number
  uptime7d: number
  uptime30d: number
  incidents: Array<{
    date: string
    duration: number
    impact: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    
    // Verify admin access (in production, implement proper authentication)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get dashboard metrics in parallel
    const [
      systemHealth,
      performanceMetrics,
      errorMetrics,
      businessMetrics,
      alertMetrics,
      uptimeMetrics
    ] = await Promise.all([
      getSystemHealth(supabase),
      getPerformanceMetrics(supabase, timeRange),
      getErrorMetrics(supabase, timeRange),
      getBusinessMetrics(supabase, timeRange),
      getAlertMetrics(supabase),
      getUptimeMetrics(supabase, timeRange)
    ])

    const dashboardData: DashboardMetrics = {
      systemHealth,
      performance: performanceMetrics,
      errors: errorMetrics,
      business: businessMetrics,
      alerts: alertMetrics,
      uptime: uptimeMetrics
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      timeRange
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    // Track the error
    await errorTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      'high',
      {
        category: 'api_external',
        metadata: { endpoint: '/api/monitoring/dashboard' }
      }
    )

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function getSystemHealth(supabase: any): Promise<SystemHealthMetrics> {
  try {
    // Check database health
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    const databaseStatus: ServiceStatus = {
      status: dbError ? 'unhealthy' : 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: dbError ? undefined : 50 // Mock response time
    }

    // Check AI service health (mock - in production, ping actual service)
    const aiStatus: ServiceStatus = {
      status: 'healthy', // Would check OpenAI API health
      lastCheck: new Date().toISOString(),
      responseTime: 1200
    }

    // Check image processing health
    const imageProcessingStatus: ServiceStatus = {
      status: 'healthy', // Would check Google Vision API
      lastCheck: new Date().toISOString(),
      responseTime: 800
    }

    // Check email service health
    const emailStatus: ServiceStatus = {
      status: 'healthy', // Would check Resend API
      lastCheck: new Date().toISOString(),
      responseTime: 300
    }

    // Check storage health
    const storageStatus: ServiceStatus = {
      status: 'healthy', // Would check Supabase Storage
      lastCheck: new Date().toISOString(),
      responseTime: 150
    }

    // Determine overall health
    const services = {
      database: databaseStatus,
      ai: aiStatus,
      imageProcessing: imageProcessingStatus,
      email: emailStatus,
      storage: storageStatus
    }

    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy')
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded')

    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy'
    } else if (degradedServices.length > 0) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      services,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error getting system health:', error)
    return {
      overall: 'unhealthy',
      services: {
        database: { status: 'unhealthy', lastCheck: new Date().toISOString() },
        ai: { status: 'unhealthy', lastCheck: new Date().toISOString() },
        imageProcessing: { status: 'unhealthy', lastCheck: new Date().toISOString() },
        email: { status: 'unhealthy', lastCheck: new Date().toISOString() },
        storage: { status: 'unhealthy', lastCheck: new Date().toISOString() }
      },
      lastUpdated: new Date().toISOString()
    }
  }
}

async function getPerformanceMetrics(supabase: any, timeRange: string): Promise<PerformanceMetrics> {
  try {
    const timeFilter = getTimeFilter(timeRange)

    // Get API performance metrics
    const { data: apiMetrics } = await supabase
      .from('api_usage_metrics')
      .select('response_time')
      .gte('timestamp', timeFilter)
      .order('timestamp', { ascending: false })

    // Calculate performance statistics
    const responseTimes = apiMetrics?.map(m => m.response_time) || []
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    // Calculate P95 response time
    const sortedTimes = responseTimes.sort((a, b) => a - b)
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p95ResponseTime = sortedTimes[p95Index] || 0

    // Get throughput (requests per minute)
    const { count: totalRequests } = await supabase
      .from('api_usage_metrics')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)

    const timeRangeMinutes = getTimeRangeInMinutes(timeRange)
    const throughput = totalRequests ? totalRequests / timeRangeMinutes : 0

    // Get active users
    const { count: activeUsers } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)
      .not('user_id', 'is', null)

    return {
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      throughput: Math.round(throughput * 100) / 100,
      activeUsers: activeUsers || 0,
      memoryUsage: 65, // Mock - would get from system metrics
      cpuUsage: 45 // Mock - would get from system metrics
    }

  } catch (error) {
    console.error('Error getting performance metrics:', error)
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      throughput: 0,
      activeUsers: 0,
      memoryUsage: 0,
      cpuUsage: 0
    }
  }
}

async function getErrorMetrics(supabase: any, timeRange: string): Promise<ErrorMetrics> {
  try {
    const timeFilter = getTimeFilter(timeRange)

    // Get total errors
    const { count: totalErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)

    // Get total requests for error rate calculation
    const { count: totalRequests } = await supabase
      .from('api_usage_metrics')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)

    const errorRate = totalRequests && totalErrors 
      ? (totalErrors / totalRequests) * 100 
      : 0

    // Get critical errors
    const { count: criticalErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)
      .eq('severity', 'critical')

    // Get errors by category
    const { data: errorsByCategory } = await supabase
      .rpc('get_errors_by_category', { time_window: timeRange })

    const errorCategoryMap = errorsByCategory?.reduce((acc: Record<string, number>, row: any) => {
      acc[row.category] = row.count
      return acc
    }, {}) || {}

    // Get recent errors
    const { data: recentErrorsData } = await supabase
      .from('error_logs')
      .select('message, severity, timestamp')
      .gte('timestamp', timeFilter)
      .order('timestamp', { ascending: false })
      .limit(10)

    const recentErrors = recentErrorsData?.map((error: any) => ({
      message: error.message.substring(0, 100) + (error.message.length > 100 ? '...' : ''),
      severity: error.severity,
      timestamp: error.timestamp,
      count: 1 // Would aggregate similar errors in production
    })) || []

    return {
      totalErrors: totalErrors || 0,
      errorRate: Math.round(errorRate * 100) / 100,
      criticalErrors: criticalErrors || 0,
      errorsByCategory: errorCategoryMap,
      recentErrors
    }

  } catch (error) {
    console.error('Error getting error metrics:', error)
    return {
      totalErrors: 0,
      errorRate: 0,
      criticalErrors: 0,
      errorsByCategory: {},
      recentErrors: []
    }
  }
}

async function getBusinessMetrics(supabase: any, timeRange: string): Promise<BusinessMetrics> {
  try {
    const timeFilter = getTimeFilter(timeRange)

    // Get daily active users
    const { count: dailyActiveUsers } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', timeFilter)
      .not('user_id', 'is', null)

    // Get business metrics from events
    const businessEvents = [
      'wine_added',
      'recommendation_generated',
      'ai_query_processed',
      'image_processed'
    ]

    const businessMetricsPromises = businessEvents.map(async (eventName) => {
      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeFilter)
        .eq('event_name', eventName)
      
      return { eventName, count: count || 0 }
    })

    const businessResults = await Promise.all(businessMetricsPromises)
    
    const metricsMap = businessResults.reduce((acc, result) => {
      acc[result.eventName] = result.count
      return acc
    }, {} as Record<string, number>)

    return {
      dailyActiveUsers: dailyActiveUsers || 0,
      winesAdded: metricsMap['wine_added'] || 0,
      recommendationsGenerated: metricsMap['recommendation_generated'] || 0,
      aiQueriesProcessed: metricsMap['ai_query_processed'] || 0,
      imageProcessingRequests: metricsMap['image_processed'] || 0,
      conversionRate: 0 // Would calculate based on user journey events
    }

  } catch (error) {
    console.error('Error getting business metrics:', error)
    return {
      dailyActiveUsers: 0,
      winesAdded: 0,
      recommendationsGenerated: 0,
      aiQueriesProcessed: 0,
      imageProcessingRequests: 0,
      conversionRate: 0
    }
  }
}

async function getAlertMetrics(supabase: any): Promise<AlertMetrics> {
  try {
    // Get active alerts
    const { data: activeAlertsData, count: activeAlerts } = await supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('resolved', false)
      .order('timestamp', { ascending: false })

    // Get critical alerts
    const { count: criticalAlerts } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)
      .eq('severity', 'critical')

    // Format recent alerts
    const recentAlerts = activeAlertsData?.slice(0, 5).map((alert: any) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp
    })) || []

    return {
      activeAlerts: activeAlerts || 0,
      criticalAlerts: criticalAlerts || 0,
      recentAlerts
    }

  } catch (error) {
    console.error('Error getting alert metrics:', error)
    return {
      activeAlerts: 0,
      criticalAlerts: 0,
      recentAlerts: []
    }
  }
}

async function getUptimeMetrics(supabase: any, _timeRange: string): Promise<UptimeMetrics> {
  try {
    // Get system health records
    const { data: healthRecords } = await supabase
      .from('system_health')
      .select('status, timestamp')
      .gte('timestamp', getTimeFilter('30d'))
      .order('timestamp', { ascending: false })

    // Calculate uptime percentages
    const calculateUptime = (records: any[], days: number) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const relevantRecords = records?.filter(r => new Date(r.timestamp) >= cutoff) || []
      
      if (relevantRecords.length === 0) {
        return 100
      }
      
      const healthyRecords = relevantRecords.filter(r => r.status === 'healthy')
      return (healthyRecords.length / relevantRecords.length) * 100
    }

    const uptime24h = calculateUptime(healthRecords, 1)
    const uptime7d = calculateUptime(healthRecords, 7)
    const uptime30d = calculateUptime(healthRecords, 30)

    // Mock incidents data (in production, would track actual incidents)
    const incidents = [
      // {
      //   date: '2024-01-15',
      //   duration: 45, // minutes
      //   impact: 'Database connectivity issues'
      // }
    ]

    return {
      uptime24h: Math.round(uptime24h * 100) / 100,
      uptime7d: Math.round(uptime7d * 100) / 100,
      uptime30d: Math.round(uptime30d * 100) / 100,
      incidents
    }

  } catch (error) {
    console.error('Error getting uptime metrics:', error)
    return {
      uptime24h: 100,
      uptime7d: 100,
      uptime30d: 100,
      incidents: []
    }
  }
}

function getTimeFilter(timeRange: string): string {
  const now = new Date()
  const filters = {
    '1h': new Date(now.getTime() - 60 * 60 * 1000),
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  return (filters[timeRange as keyof typeof filters] || filters['24h']).toISOString()
}

function getTimeRangeInMinutes(timeRange: string): number {
  const ranges = {
    '1h': 60,
    '24h': 24 * 60,
    '7d': 7 * 24 * 60,
    '30d': 30 * 24 * 60
  }
  return ranges[timeRange as keyof typeof ranges] || ranges['24h']
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}