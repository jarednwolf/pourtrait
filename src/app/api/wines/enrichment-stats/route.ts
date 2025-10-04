/**
 * API Route for Wine Enrichment Statistics
 * 
 * Provides endpoints for getting enrichment statistics and managing enrichment data
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WineEnrichmentService } from '@/lib/services/wine-enrichment'
import { ExternalWineDataService } from '@/lib/services/external-wine-data'

// ============================================================================
// GET /api/wines/enrichment-stats - Get enrichment statistics for user
// ============================================================================

export async function GET() {
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

    // Get enrichment statistics
    const stats = await WineEnrichmentService.getEnrichmentStats(session.user.id)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Enrichment stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/wines/enrichment-stats - Clear enrichment cache
// ============================================================================

export async function DELETE() {
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

    // Clear the enrichment cache
    ExternalWineDataService.clearCache()

    return NextResponse.json({
      success: true,
      message: 'Enrichment cache cleared successfully'
    })

  } catch (error) {
    console.error('Clear cache error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}