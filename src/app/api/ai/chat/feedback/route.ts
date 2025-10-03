// AI Chat Feedback API Route

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// Chat Feedback Endpoint
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    if (!body.messageId || !body.feedback) {
      return NextResponse.json(
        { error: 'Message ID and feedback type are required' },
        { status: 400 }
      )
    }

    const validFeedbackTypes = ['helpful', 'not_helpful', 'inappropriate', 'inaccurate']
    if (!validFeedbackTypes.includes(body.feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Find the chat interaction to get the interaction ID
    // Note: messageId in the frontend might be different from database ID
    // We'll need to match based on user_id and approximate timestamp or content
    const { data: interaction, error: findError } = await supabase
      .from('chat_interactions')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10) // Get recent interactions to find the right one

    if (findError) {
      throw findError
    }

    // For now, we'll use the most recent interaction
    // In a production system, you'd want better message ID tracking
    const chatInteractionId = interaction?.[0]?.id

    if (!chatInteractionId) {
      return NextResponse.json(
        { error: 'Chat interaction not found' },
        { status: 404 }
      )
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('chat_feedback')
      .insert({
        chat_interaction_id: chatInteractionId,
        user_id: user.id,
        feedback_type: body.feedback,
        feedback_details: body.details || null
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      data: {
        feedbackId: feedback.id,
        message: 'Feedback submitted successfully'
      }
    })

  } catch (error) {
    console.error('Chat Feedback API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Get Feedback Analytics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d'

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Calculate date range
    const now = new Date()
    const timeframeHours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeframe] || 24 * 7

    const startDate = new Date(now.getTime() - timeframeHours * 60 * 60 * 1000)

    // Get feedback analytics
    const { data: feedbackStats, error } = await supabase
      .from('chat_feedback')
      .select('feedback_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw error
    }

    // Process feedback statistics
    const stats = {
      total: feedbackStats.length,
      helpful: feedbackStats.filter(f => f.feedback_type === 'helpful').length,
      not_helpful: feedbackStats.filter(f => f.feedback_type === 'not_helpful').length,
      inappropriate: feedbackStats.filter(f => f.feedback_type === 'inappropriate').length,
      inaccurate: feedbackStats.filter(f => f.feedback_type === 'inaccurate').length,
      satisfaction_rate: 0
    }

    if (stats.total > 0) {
      stats.satisfaction_rate = stats.helpful / stats.total
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        stats,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Feedback Analytics API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}