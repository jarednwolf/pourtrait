/**
 * API Route for Wine Data Enrichment
 * 
 * Provides endpoints for enriching wine data with external sources
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WineEnrichmentService, EnrichmentOptions } from '@/lib/services/wine-enrichment'
import { WineKnowledgeBaseService } from '@/lib/services/wine-knowledge-base'
import { WineService } from '@/lib/services/wine-service'

// ============================================================================
// POST /api/wines/enrich - Enrich a single wine
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { wineId, options = {} } = body

    if (!wineId) {
      return NextResponse.json(
        { error: 'Wine ID is required' },
        { status: 400 }
      )
    }

    // Verify wine ownership
    const wine = await WineService.getWineById(wineId)
    if (!wine || wine.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Wine not found or access denied' },
        { status: 404 }
      )
    }

    // Enrich the wine
    const enrichmentOptions: EnrichmentOptions = {
      forceRefresh: options.forceRefresh || false,
      timeout: options.timeout || 10000,
      includeImages: options.includeImages || false
    }

    const result = await WineEnrichmentService.enrichWine(wineId, enrichmentOptions)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Enrichment failed',
          details: result.errors 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wine: result.wine,
      enrichmentData: result.enrichmentData,
      sources: result.sources,
      confidence: result.confidence,
      cached: result.cached
    })

  } catch (error) {
    console.error('Wine enrichment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/wines/enrich - Bulk enrich multiple wines
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { wineIds, options = {} } = body

    if (!wineIds || !Array.isArray(wineIds) || wineIds.length === 0) {
      return NextResponse.json(
        { error: 'Wine IDs array is required' },
        { status: 400 }
      )
    }

    if (wineIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 wines can be enriched at once' },
        { status: 400 }
      )
    }

    // Verify all wines belong to the user
    const wines = await Promise.all(
      wineIds.map(id => WineService.getWineById(id))
    )

    const invalidWines = wines.filter(wine => !wine || wine.user_id !== session.user.id)
    if (invalidWines.length > 0) {
      return NextResponse.json(
        { error: 'Some wines not found or access denied' },
        { status: 404 }
      )
    }

    // Perform bulk enrichment
    const enrichmentOptions: EnrichmentOptions = {
      forceRefresh: options.forceRefresh || false,
      timeout: options.timeout || 10000
    }

    const result = await WineEnrichmentService.bulkEnrichWines(wineIds, enrichmentOptions)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      results: result.results,
      errors: result.errors
    })

  } catch (error) {
    console.error('Bulk wine enrichment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/wines/enrich?wineId=xxx - Get enrichment suggestions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const wineId = searchParams.get('wineId')
    const action = searchParams.get('action')

    if (!wineId) {
      return NextResponse.json(
        { error: 'Wine ID is required' },
        { status: 400 }
      )
    }

    // Verify wine ownership
    const wine = await WineService.getWineById(wineId)
    if (!wine || wine.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Wine not found or access denied' },
        { status: 404 }
      )
    }

    if (action === 'suggestions') {
      // Get enrichment suggestions
      const suggestions = await WineEnrichmentService.getEnrichmentSuggestions(wineId)
      
      return NextResponse.json({
        success: true,
        suggestions: suggestions.suggestions,
        missingData: suggestions.missingData,
        confidence: suggestions.confidence
      })
    } else if (action === 'knowledge') {
      // Get wine knowledge
      const knowledge = await WineKnowledgeBaseService.getWineKnowledge(wine)
      
      return NextResponse.json({
        success: true,
        knowledge
      })
    } else if (action === 'education') {
      // Get educational content
      const education = WineKnowledgeBaseService.getWineEducation(wine)
      
      return NextResponse.json({
        success: true,
        education
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: suggestions, knowledge, or education' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Wine enrichment info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}