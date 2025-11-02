/**
 * Mark Notification as Read API
 * 
 * Marks a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Mark the notification as read in the notifications table
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error marking notification as read:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }

    // Log the read action for analytics
    try {
      await supabase
        .from('notification_delivery_logs')
        .insert({
          scheduled_notification_id: notificationId,
          delivery_status: 'clicked',
          delivery_channels: [{
            type: 'read_action',
            success: true,
            timestamp: new Date().toISOString()
          }],
          attempted_at: new Date().toISOString(),
          metadata: {
            action: 'mark_read',
            userId: user.id
          }
        })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error logging read action:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Error in POST /api/notifications/[id]/read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}