/**
 * Notification Snooze API
 * 
 * Allows users to snooze notifications for a specified duration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
// import { NotificationScheduler } from '@/lib/services/notification-scheduler'

interface SnoozeRequest {
  notificationId: string
  snoozeMinutes: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSSRServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { notificationId, snoozeMinutes }: SnoozeRequest = await request.json()

    // Validate input
    if (!notificationId || !snoozeMinutes || snoozeMinutes <= 0) {
      return NextResponse.json(
        { error: 'Invalid notification ID or snooze duration' },
        { status: 400 }
      )
    }

    // Limit snooze duration to reasonable bounds (max 24 hours)
    const maxSnoozeMinutes = 24 * 60 // 24 hours
    const actualSnoozeMinutes = Math.min(snoozeMinutes, maxSnoozeMinutes)

    // Get the original notification
    const { data: notification, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Calculate new scheduled time
    const newScheduledTime = new Date()
    newScheduledTime.setMinutes(newScheduledTime.getMinutes() + actualSnoozeMinutes)

    // Update the notification's scheduled time and reset status to pending
    const { error: updateError } = await supabase
      .from('scheduled_notifications')
      .update({
        scheduled_for: newScheduledTime.toISOString(),
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error snoozing notification:', updateError)
      return NextResponse.json(
        { error: 'Failed to snooze notification' },
        { status: 500 }
      )
    }

    // Log the snooze action
    await supabase
      .from('notification_delivery_logs')
      .insert({
        scheduled_notification_id: notificationId,
        delivery_status: 'sent', // This represents the snooze action being completed
        delivery_channels: [{
          type: 'snooze',
          success: true,
          snoozeMinutes: actualSnoozeMinutes,
          newScheduledTime: newScheduledTime.toISOString()
        }],
        attempted_at: new Date().toISOString(),
        metadata: {
          action: 'snooze',
          originalScheduledTime: notification.scheduled_for,
          snoozeMinutes: actualSnoozeMinutes
        }
      })

    return NextResponse.json({
      success: true,
      message: `Notification snoozed for ${actualSnoozeMinutes} minutes`,
      newScheduledTime: newScheduledTime.toISOString(),
      snoozeMinutes: actualSnoozeMinutes
    })

  } catch (error) {
    console.error('Error in POST /api/notifications/snooze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}