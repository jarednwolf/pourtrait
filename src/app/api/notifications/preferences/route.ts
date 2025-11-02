/**
 * Notification Preferences API
 * 
 * Manages user notification preferences and settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'

interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  drinkingWindowAlerts: boolean
  recommendationAlerts: boolean
  inventoryReminders: boolean
  systemAlerts: boolean
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
  frequency?: {
    drinkingWindow: 'immediate' | 'daily' | 'weekly'
    recommendations: 'immediate' | 'daily' | 'weekly'
    inventory: 'weekly' | 'monthly' | 'never'
  }
}

// GET - Retrieve user notification preferences
export async function GET() {
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

    // Get user profile with notification preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return preferences with defaults if none exist
    const preferences = profile?.notification_preferences || {
      pushEnabled: true,
      emailEnabled: true,
      drinkingWindowAlerts: true,
      recommendationAlerts: true,
      inventoryReminders: true,
      systemAlerts: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      frequency: {
        drinkingWindow: 'immediate',
        recommendations: 'daily',
        inventory: 'weekly'
      }
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user notification preferences
export async function PUT(request: NextRequest) {
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

    const preferences: NotificationPreferences = await request.json()

    // Validate preferences structure
    if (!isValidPreferences(preferences)) {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      )
    }

    // Update user profile with new preferences
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating notification preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    })

  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update specific preference
export async function PATCH(request: NextRequest) {
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

    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Get current preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch current preferences' },
        { status: 500 }
      )
    }

    const currentPreferences = profile?.notification_preferences || {}
    const updatedPreferences = { ...currentPreferences, [key]: value }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        notification_preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating notification preference:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preference updated successfully',
      preferences: updatedPreferences
    })

  } catch (error) {
    console.error('Error in PATCH /api/notifications/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validate notification preferences structure
function isValidPreferences(preferences: any): preferences is NotificationPreferences {
  if (typeof preferences !== 'object' || preferences === null) {
    return false
  }

  // Check required boolean fields
  const requiredBooleans = [
    'pushEnabled',
    'emailEnabled',
    'drinkingWindowAlerts',
    'recommendationAlerts',
    'inventoryReminders',
    'systemAlerts'
  ]

  for (const field of requiredBooleans) {
    if (typeof preferences[field] !== 'boolean') {
      return false
    }
  }

  // Validate quiet hours if present
  if (preferences.quietHours) {
    const { quietHours } = preferences
    if (
      typeof quietHours.enabled !== 'boolean' ||
      typeof quietHours.start !== 'string' ||
      typeof quietHours.end !== 'string'
    ) {
      return false
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(quietHours.start) || !timeRegex.test(quietHours.end)) {
      return false
    }
  }

  // Validate frequency if present
  if (preferences.frequency) {
    const { frequency } = preferences
    const validDrinkingWindow = ['immediate', 'daily', 'weekly']
    const validRecommendations = ['immediate', 'daily', 'weekly']
    const validInventory = ['weekly', 'monthly', 'never']

    if (
      !validDrinkingWindow.includes(frequency.drinkingWindow) ||
      !validRecommendations.includes(frequency.recommendations) ||
      !validInventory.includes(frequency.inventory)
    ) {
      return false
    }
  }

  return true
}