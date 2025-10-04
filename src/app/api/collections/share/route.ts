import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { collectionSharingService, ShareOptions } from '@/lib/services/collection-sharing'

export async function POST(request: NextRequest) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const shareOptions: ShareOptions = body

    // Validate required fields
    if (!shareOptions.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create shared collection
    const sharedCollection = await collectionSharingService.createSharedCollection(
      user.id,
      shareOptions
    )

    // Generate share URL
    const shareUrl = collectionSharingService.getShareUrl(sharedCollection.shareToken)

    return NextResponse.json({
      collection: sharedCollection,
      shareUrl
    })

  } catch (error) {
    console.error('Share collection error:', error)
    return NextResponse.json(
      { error: 'Failed to create shared collection' },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's shared collections
    const collections = await collectionSharingService.getUserSharedCollections(user.id)

    return NextResponse.json({ collections })

  } catch (error) {
    console.error('Get shared collections error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared collections' },
      { status: 500 }
    )
  }
}