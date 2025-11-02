import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import { WineSearchService } from '@/lib/services/wine-search'
import type { SearchFilters } from '@/types'

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

    // Get saved searches
    const savedSearches = await WineSearchService.getSavedSearches(user.id)

    return NextResponse.json({
      success: true,
      data: savedSearches
    })

  } catch (error) {
    console.error('Get saved searches error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get saved searches' 
      },
      { status: 500 }
    )
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

    const body = await request.json()
    const { name, filters, isDefault } = body as { 
      name: string
      filters: SearchFilters
      isDefault?: boolean 
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Search name is required' },
        { status: 400 }
      )
    }

    // Save the search
    const savedSearch = await WineSearchService.saveSearch(
      user.id, 
      name.trim(), 
      filters, 
      isDefault || false
    )

    return NextResponse.json({
      success: true,
      data: savedSearch
    })

  } catch (error) {
    console.error('Save search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save search' 
      },
      { status: 500 }
    )
  }
}