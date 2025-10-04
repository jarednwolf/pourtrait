/**
 * Notification Processing API
 * 
 * Processes scheduled notifications - typically called by cron jobs
 * This endpoint handles the delivery of pending notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

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

    logger.info('Processing scheduled notifications...')

    // Process pending notifications
    await NotificationScheduler.processPendingNotifications()

    // Also process drinking window alerts for all users (legacy support)
    await NotificationService.processAllUserAlerts()

    logger.info('Notification processing completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error processing notifications:', { error } as any)
    
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
    // Support Vercel Cron GET semantics: if x-vercel-cron header is present
    // or a valid Authorization bearer token is provided, run processing.
    const cronHeader = request.headers.get('x-vercel-cron')
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.NOTIFICATION_CRON_SECRET

    const authorized = Boolean(cronHeader) || (cronSecret ? authHeader === `Bearer ${cronSecret}` : false)

    if (authorized) {
      logger.info('Cron-triggered notification processing...')

      await NotificationScheduler.processPendingNotifications()
      await NotificationService.processAllUserAlerts()

      return NextResponse.json({
        success: true,
        message: 'Notifications processed successfully (cron GET)',
        timestamp: new Date().toISOString()
      })
    }

    // Default: health response
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'notification-processor'
    })
  } catch (error) {
    logger.error('Health check failed:', { error } as any)
    
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