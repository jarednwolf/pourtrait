// AI Recommendations API Route - Vercel Edge Function

import { NextRequest, NextResponse } from 'next/server'
import { AIRecommendationEngine } from '@/lib/ai/recommendation-engine'
import { AIRecommendationRequest } from '@/lib/ai/types'
import { createClient } from '@supabase/supabase-js'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// AI Recommendations Endpoint
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

    // Verify user and get profile
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user's taste profile
    const { data: tasteProfile, error: profileError } = await supabase
      .from('taste_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !tasteProfile) {
      return NextResponse.json(
        { error: 'User taste profile not found' },
        { status: 404 }
      )
    }

    // Get user's wine inventory if requested
    let inventory = undefined
    if (body.includeInventory) {
      const { data: wines } = await supabase
        .from('wines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      inventory = wines || []
    }

    // Build AI recommendation request
    const aiRequest: AIRecommendationRequest = {
      userId: user.id,
      query: body.query,
      context: body.context || {},
      userProfile: tasteProfile,
      inventory,
      experienceLevel: body.experienceLevel || tasteProfile.experience_level || 'intermediate'
    }

    // Generate recommendations using AI engine
    const engine = new AIRecommendationEngine()
    const recommendations = await engine.generateRecommendations(aiRequest)

    // Log the interaction for learning
    await logInteraction(supabase, user.id, aiRequest, recommendations)

    // Return recommendations
    return NextResponse.json({
      success: true,
      data: recommendations
    })

  } catch (error) {
    console.error('AI Recommendations API Error:', error)
    
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
  if (!body.query || typeof body.query !== 'string') {
    return { valid: false, error: 'Query is required and must be a string' }
  }

  if (body.query.length > 1000) {
    return { valid: false, error: 'Query is too long (max 1000 characters)' }
  }

  if (body.context && typeof body.context !== 'object') {
    return { valid: false, error: 'Context must be an object' }
  }

  if (body.experienceLevel && !['beginner', 'intermediate', 'advanced'].includes(body.experienceLevel)) {
    return { valid: false, error: 'Invalid experience level' }
  }

  return { valid: true }
}

// ============================================================================
// Interaction Logging
// ============================================================================

async function logInteraction(
  supabase: any,
  userId: string,
  request: AIRecommendationRequest,
  response: any
): Promise<void> {
  try {
    await supabase
      .from('ai_interactions')
      .insert({
        user_id: userId,
        query: request.query,
        context: request.context,
        recommendations_count: response.recommendations.length,
        confidence: response.confidence,
        response_time: response.responseMetadata.responseTime,
        tokens_used: response.responseMetadata.tokensUsed,
        model: response.responseMetadata.model,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging AI interaction:', error)
    // Don't fail the request if logging fails
  }
}

// ============================================================================
// GET Method - Health Check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'AI Recommendations API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}