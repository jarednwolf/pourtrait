// Food Pairing Recommendations API Route

import { NextRequest, NextResponse } from 'next/server'
import { FoodPairingService } from '@/lib/services/food-pairing'
// import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time issues
let foodPairingService: FoodPairingService | null = null

function getFoodPairingService(): FoodPairingService {
  if (!foodPairingService) {
    foodPairingService = new FoodPairingService()
  }
  return foodPairingService
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      foodDescription, 
      cuisine, 
      cookingMethod, 
      spiceLevel, 
      richness, 
      context 
    } = body

    // Validate required fields
    if (!userId || !foodDescription) {
      return NextResponse.json(
        { success: false, error: 'User ID and food description are required' },
        { status: 400 }
      )
    }

    // Generate food pairing recommendations
    const pairingResponse = await getFoodPairingService().generateFoodPairings({
      userId,
      foodDescription,
      cuisine,
      cookingMethod,
      spiceLevel,
      richness,
      context
    })

    return NextResponse.json({
      success: true,
      data: pairingResponse
    })

  } catch (error) {
    console.error('Error generating food pairings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const occasion = searchParams.get('occasion')
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const currency = searchParams.get('currency') || 'USD'
    const wineTypes = searchParams.get('wineTypes')?.split(',')
    const urgency = searchParams.get('urgency') as 'low' | 'medium' | 'high'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build contextual filters
    const filters: any = {
      availability: 'inventory_only',
      occasion,
      urgency
    }

    if (priceMin && priceMax) {
      filters.priceRange = {
        min: parseFloat(priceMin),
        max: parseFloat(priceMax),
        currency
      }
    }

    if (wineTypes && wineTypes.length > 0) {
      filters.wineType = wineTypes
    }

    // Generate contextual recommendations
    const contextualResponse = await getFoodPairingService().generateContextualRecommendations(
      userId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: contextualResponse
    })

  } catch (error) {
    console.error('Error generating contextual recommendations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}