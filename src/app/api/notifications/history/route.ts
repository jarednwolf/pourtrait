/**
 * Notification History API
 * 
 * Provides access to user's notification history and delivery statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Retrieve user notification history
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items
    const type = searchParams.get('type') // Filter by notification type
    const status = searchParams.get('status') // Filter by status
    const includeStats = searchParams.get('includeStats') === 'true'

    const offset = (page - 1) * limit

    // Build query for scheduled notifications
    let query = supabase
      .from('scheduled_notifications')
      .select(`
        id,
        type,
        scheduled_for,
        payload,
        status,
        attempts,
        last_attempt,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: notifications, error: notificationsError, count } = await query

    if (notificationsError) {
      console.error('Error fetching notification history:', notificationsError)
      return NextResponse.json(
        { error: 'Failed to fetch notification history' },
        { status: 500 }
      )
    }

    // Parse payload JSON for each notification
    const parsedNotifications = notifications?.map(notification => ({
      ...notification,
      payload: JSON.parse(notification.payload)
    })) || []

    let stats = null
    if (includeStats) {
      // Get delivery statistics
      const { data: statsData, error: statsError } = await supabase
        .from('scheduled_notifications')
        .select('status')
        .eq('user_id', user.id)

      if (!statsError && statsData) {
        stats = {
          total: statsData.length,
          sent: statsData.filter(n => n.status === 'sent').length,
          failed: statsData.filter(n => n.status === 'failed').length,
          pending: statsData.filter(n => n.status === 'pending').length,
          cancelled: statsData.filter(n => n.status === 'cancelled').length
        }
        
        // Calculate delivery rate
        stats.deliveryRate = stats.total > 0 
          ? Math.round((stats.sent / stats.total) * 100) 
          : 0
      }
    }

    return NextResponse.json({
      success: true,
      notifications: parsedNotifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      },
      stats,
      filters: {
        type,
        status
      }
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear notification history (with optional filters)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const olderThan = searchParams.get('olderThan') // ISO date string
    const confirmDelete = searchParams.get('confirm') === 'true'

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to proceed.' },
        { status: 400 }
      )
    }

    // Build delete query
    let deleteQuery = supabase
      .from('scheduled_notifications')
      .delete()
      .eq('user_id', user.id)

    // Apply filters
    if (type) {
      deleteQuery = deleteQuery.eq('type', type)
    }
    if (status) {
      deleteQuery = deleteQuery.eq('status', status)
    }
    if (olderThan) {
      const cutoffDate = new Date(olderThan)
      if (isNaN(cutoffDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid olderThan date format' },
          { status: 400 }
        )
      }
      deleteQuery = deleteQuery.lt('created_at', cutoffDate.toISOString())
    }

    // Only allow deletion of completed notifications (sent, failed, cancelled)
    deleteQuery = deleteQuery.in('status', ['sent', 'failed', 'cancelled'])

    const { error: deleteError, count } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting notification history:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete notification history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${count || 0} notification records`,
      deletedCount: count || 0
    })

  } catch (error) {
    console.error('Error in DELETE /api/notifications/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}