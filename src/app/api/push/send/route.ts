/**
 * Push Notification Send API
 * 
 * Sends push notifications to subscribed users
 * This would typically be called by server-side processes or cron jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import webpush from 'web-push'

// Function to configure web-push with VAPID keys
function configureWebPush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured')
  }
  
  // Validate VAPID public key format (URL-safe base64 without padding)
  if (vapidPublicKey.includes('=') || vapidPublicKey.includes('+') || vapidPublicKey.includes('/')) {
    throw new Error('VAPID public key must be URL-safe base64 without padding')
  }
  
  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface SendNotificationRequest {
  userId?: string
  userIds?: string[]
  payload: NotificationPayload
  apiKey?: string // For server-to-server authentication
}

export async function POST(request: NextRequest) {
  try {
    // Configure VAPID keys
    configureWebPush()
    
    const supabase = await createSSRServerClient()
    const body: SendNotificationRequest = await request.json()

    // Validate API key for server-to-server requests
    const apiKey = request.headers.get('x-api-key') || body.apiKey
    if (apiKey !== process.env.PUSH_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { userId, userIds, payload } = body

    if (!userId && !userIds) {
      return NextResponse.json(
        { error: 'userId or userIds is required' },
        { status: 400 }
      )
    }

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Notification title and body are required' },
        { status: 400 }
      )
    }

    // Get push subscriptions for the specified user(s)
    let query = supabase.from('push_subscriptions').select('*')
    
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (userIds) {
      query = query.in('user_id', userIds)
    }

    const { data: subscriptions, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No subscriptions found' },
        { status: 200 }
      )
    }

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        }

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
          image: payload.image,
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions,
        })

        await webpush.sendNotification(pushSubscription, notificationPayload)
        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
        console.error('Error sending notification to:', subscription.endpoint, error)
        
        // If subscription is invalid, remove it from database
        if (error instanceof Error && error.message.includes('410')) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      results,
    })

  } catch (error) {
    console.error('Error in push send:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to send notifications (can be used by other API routes)
export async function sendPushNotification(
  userIds: string | string[],
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PUSH_API_KEY || '',
      },
      body: JSON.stringify({
        userIds: Array.isArray(userIds) ? userIds : [userIds],
        payload,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send push notification')
    }

    const result = await response.json()
    return {
      success: result.success,
      sent: result.sent || 0,
      failed: result.failed || 0,
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, sent: 0, failed: 1 }
  }
}