// Personalized Recommendations API Route - Vercel Edge Function

import { NextRequest, NextResponse } from 'next/server'
import { PersonalizedRecommendationService, PersonalizedRecommendationRequest } from '@/lib/services/personalized-recommendations'
import { createClient } from '@supabase/supabase-js'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// Personalized Recommendations Endpoint
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const validationResult = validateRequest(body)
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

    // Build recommendation request
    const recommendationRequest: PersonalizedRecommendationRequest = {
      userId: user.id,
      type: body.type,
      context: body.context
    }

    // Generate personalized recommendations
    const service = new PersonalizedRecommendationService()
    const recommendations = await service.generateRecommendations(recommendationRequest)

    // Log the interaction
    await logRecommendationRequest(supabase, user.id, recommendationRequest, recommendations)

    // Return recommendations
    return NextResponse.json({
      success: true,
      data: recommendations
    })

  } catch (error) {
    console.error('Personalized Recommendations API Error:', error)
    
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

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.type || !['tonight', 'purchase', 'contextual'].includes(body.type)) {
    return { valid: false, error: 'Valid recommendation type is required (tonight, purchase, contextual)' }
  }

  if (body.type === 'contextual' && !body.context) {
    return { valid: false, error: 'Context is required for contextual recommendations' }
  }

  if (body.context && typeof body.context !== 'object') {
    return { valid: false, error: 'Context must be an object' }
  }

  return { valid: true }
}

// ============================================================================
// Interaction Logging
// ============================================================================

async function logRecommendationRequest(
  supabase: any,
  userId: string,
  request: PersonalizedRecommendationRequest,
  response: any
): Promise<void> {
  try {
    await supabase
      .from('recommendation_requests')
      .insert({
        user_id: userId,
        request_type: request.type,
        context: request.context,
        recommendations_count: response.recommendations.length,
        confidence: response.confidence,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging recommendation request:', error)
    // Don't fail the request if logging fails
  }
}

// ============================================================================
// GET Method - Health Check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Personalized Recommendations API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}