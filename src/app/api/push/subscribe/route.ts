/**
 * Push Notification Subscribe API
 * 
 * Handles push notification subscription registration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

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

    const subscriptionData: PushSubscriptionData = await request.json()

    // Validate subscription data
    if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Store subscription in database
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys.p256dh,
        auth_key: subscriptionData.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint'
      })

    if (insertError) {
      console.error('Error storing push subscription:', insertError)
      return NextResponse.json(
        { error: 'Failed to store subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in push subscribe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}