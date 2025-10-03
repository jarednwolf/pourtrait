// Recommendation Feedback API Route - Vercel Edge Function

import { NextRequest, NextResponse } from 'next/server'
import { RecommendationFeedbackService } from '@/lib/services/personalized-recommendations'
import { createClient } from '@supabase/supabase-js'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// Recommendation Feedback Endpoint
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const validationResult = validateFeedbackRequest(body)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
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

    // Record feedback
    const feedbackService = new RecommendationFeedbackService()
    await feedbackService.recordFeedback(
      body.recommendationId,
      user.id,
      body.feedback,
      body.reason,
      body.modifiedContext
    )

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    })

  } catch (error) {
    console.error('Recommendation Feedback API Error:', error)
    
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
// Get Recommendation History Endpoint
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') as 'inventory' | 'purchase' | 'pairing' | undefined
    const analytics = searchParams.get('analytics') === 'true'

    const feedbackService = new RecommendationFeedbackService()

    if (analytics) {
      // Return analytics data
      const analyticsData = await feedbackService.getRecommendationAnalytics(user.id)
      return NextResponse.json({
        success: true,
        data: analyticsData
      })
    } else {
      // Return recommendation history
      const history = await feedbackService.getRecommendationHistory(user.id, limit, type)
      return NextResponse.json({
        success: true,
        data: history
      })
    }

  } catch (error) {
    console.error('Recommendation History API Error:', error)
    
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
// Request Validation
// ============================================================================

function validateFeedbackRequest(body: any): { valid: boolean; error?: string } {
  if (!body.recommendationId || typeof body.recommendationId !== 'string') {
    return { valid: false, error: 'Recommendation ID is required' }
  }

  if (!body.feedback || !['accepted', 'rejected', 'modified'].includes(body.feedback)) {
    return { valid: false, error: 'Valid feedback is required (accepted, rejected, modified)' }
  }

  if (body.reason && typeof body.reason !== 'string') {
    return { valid: false, error: 'Reason must be a string' }
  }

  if (body.modifiedContext && typeof body.modifiedContext !== 'object') {
    return { valid: false, error: 'Modified context must be an object' }
  }

  return { valid: true }
}