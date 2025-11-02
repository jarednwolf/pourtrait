import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import { WineSearchService } from '@/lib/services/wine-search'

export async function GET(request: NextRequest) {
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

    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get suggestions
    const suggestions = await WineSearchService.getSearchSuggestions(user.id, query, limit)

    return NextResponse.json({
      success: true,
      data: suggestions
    })

  } catch (error) {
    console.error('Search suggestions error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get suggestions' 
      },
      { status: 500 }
    )
  }
}