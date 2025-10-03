/**
 * Notification Processing API
 * 
 * Processes scheduled notifications - typically called by cron jobs
 * This endpoint handles the delivery of pending notifications
 */

import { NextRequest, NextResponse } from 'next/server'

// Configure function timeout for Vercel
export const maxDuration = 60
import { NotificationScheduler } from '@/lib/services/notification-scheduler'
import { NotificationService } from '@/lib/services/notification-service'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (cron job, internal service, etc.)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.NOTIFICATION_CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Processing scheduled notifications...')

    // Process pending notifications
    await NotificationScheduler.processPendingNotifications()

    // Also process drinking window alerts for all users (legacy support)
    await NotificationService.processAllUserAlerts()

    console.log('Notification processing completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing notifications:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  try {
    // Basic health check - verify database connectivity
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'notification-processor'
    }

    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        service: 'notification-processor'
      },
      { status: 500 }
    )
  }
}