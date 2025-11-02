import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import { restaurantWineAnalysisService } from '@/lib/services/restaurant-wine-analysis'
import { ExtractedWineListItem, RecommendationContext } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createSSRServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { wines, context } = body

    // Validate input
    if (!wines || !Array.isArray(wines)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wines data. Expected array of extracted wines.' },
        { status: 400 }
      )
    }

    if (wines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No wines provided for analysis.' },
        { status: 400 }
      )
    }

    // Validate wine objects
    for (const wine of wines) {
      if (!wine.name || typeof wine.name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid wine data. Each wine must have a name.' },
          { status: 400 }
        )
      }
    }

    // Analyze restaurant wine list
    const analysisResult = await restaurantWineAnalysisService.analyzeRestaurantWineList(
      wines as ExtractedWineListItem[],
      user.id,
      context as RecommendationContext
    )

    return NextResponse.json({
      success: true,
      data: analysisResult
    })

  } catch (error) {
    console.error('Restaurant wine analysis API error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to analyze')) {
        return NextResponse.json(
          { success: false, error: 'Unable to analyze wine list. Please try again.' },
          { status: 422 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error occurred while analyzing the restaurant wine list' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze restaurant wine lists.' },
    { status: 405 }
  )
}