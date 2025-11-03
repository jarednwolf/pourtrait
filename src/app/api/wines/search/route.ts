import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import { WineSearchService } from '@/lib/services/wine-search'
import type { SearchFilters } from '@/types'

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
    
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    }

    // Parse array parameters
    const types = searchParams.get('types')
    if (types) {
      filters.type = types.split(',') as any[]
    }

    const regions = searchParams.get('regions')
    if (regions) {
      filters.region = regions.split(',')
    }

    const countries = searchParams.get('countries')
    if (countries) {
      filters.country = countries.split(',')
    }

    const producers = searchParams.get('producers')
    if (producers) {
      filters.producer = producers.split(',')
    }

    const varietals = searchParams.get('varietals')
    if (varietals) {
      filters.varietal = varietals.split(',')
    }

    const drinkingWindowStatus = searchParams.get('drinkingWindowStatus')
    if (drinkingWindowStatus) {
      filters.drinkingWindowStatus = drinkingWindowStatus.split(',') as any[]
    }

    // Parse range parameters
    const vintageMin = searchParams.get('vintageMin')
    const vintageMax = searchParams.get('vintageMax')
    if (vintageMin || vintageMax) {
      filters.vintage = {
        min: vintageMin ? parseInt(vintageMin) : undefined,
        max: vintageMax ? parseInt(vintageMax) : undefined
      }
    }

    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    if (priceMin || priceMax) {
      filters.priceRange = {
        min: priceMin ? parseFloat(priceMin) : undefined,
        max: priceMax ? parseFloat(priceMax) : undefined,
        currency: 'USD'
      }
    }

    const ratingMin = searchParams.get('ratingMin')
    const ratingMax = searchParams.get('ratingMax')
    if (ratingMin || ratingMax) {
      filters.rating = {
        min: ratingMin ? parseFloat(ratingMin) : undefined,
        max: ratingMax ? parseFloat(ratingMax) : undefined
      }
    }

    // Perform the search
    const results = await WineSearchService.searchWines(user.id, filters)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Wine search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { filters } = body as { filters: SearchFilters }

    // Perform the search
    const results = await WineSearchService.searchWines(user.id, filters)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Wine search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    )
  }
}