/**
 * Push Notification Unsubscribe API
 * 
 * Handles push notification subscription removal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // Remove subscription from database
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (deleteError) {
      console.error('Error removing push subscription:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in push unsubscribe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}