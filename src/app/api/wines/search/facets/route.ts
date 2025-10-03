import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WineSearchService } from '@/lib/services/wine-search'
import type { SearchFilters } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse current filters to calculate facets
    const { searchParams } = new URL(request.url)
    
    const currentFilters: SearchFilters = {
      query: searchParams.get('query') || undefined
    }

    // Parse array parameters for current filters
    const types = searchParams.get('types')
    if (types) {
      currentFilters.type = types.split(',') as any[]
    }

    const regions = searchParams.get('regions')
    if (regions) {
      currentFilters.region = regions.split(',')
    }

    // Get facets
    const facets = await WineSearchService.getSearchFacets(user.id, currentFilters)

    return NextResponse.json({
      success: true,
      data: facets
    })

  } catch (error) {
    console.error('Search facets error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get facets' 
      },
      { status: 500 }
    )
  }
}