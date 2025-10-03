import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connection
    const supabase = createServerClient()
    const { data: dbHealth, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (dbError) {
      throw new Error(`Database health check failed: ${dbError.message}`)
    }

    // Check AI service availability (basic check)
    let aiHealth = 'healthy'
    try {
      if (process.env.OPENAI_API_KEY) {
        // Simple check - just verify the API key format
        const apiKeyValid = process.env.OPENAI_API_KEY.startsWith('sk-')
        if (!apiKeyValid) {
          aiHealth = 'degraded'
        }
      } else {
        aiHealth = 'unavailable'
      }
    } catch (error) {
      aiHealth = 'degraded'
    }

    // Check external services configuration
    const services = {
      database: 'healthy',
      ai: aiHealth,
      imageProcessing: process.env.GOOGLE_VISION_API_KEY ? 'healthy' : 'unavailable',
      email: process.env.RESEND_API_KEY ? 'healthy' : 'unavailable',
      storage: 'healthy' // Supabase storage is included with database
    }

    const responseTime = Date.now() - startTime
    
    // Determine overall health
    const unhealthyServices = Object.values(services).filter(status => status === 'unhealthy')
    const degradedServices = Object.values(services).filter(status => status === 'degraded')
    
    let overallStatus = 'healthy'
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded'
    }

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      services,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthData, { status: statusCode })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    }, { status: 503 })
  }
}

// Support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    const supabase = createServerClient()
    const { error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      return new NextResponse(null, { status: 503 })
    }
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}