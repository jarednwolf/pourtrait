import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { collectionSharingService } from '@/lib/services/collection-sharing'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, isPublic } = body

    let updatedCollection

    if (typeof isPublic === 'boolean') {
      // Toggle visibility
      updatedCollection = await collectionSharingService.toggleCollectionVisibility(
        params.id,
        user.id,
        isPublic
      )
    } else {
      // Update collection details
      updatedCollection = await collectionSharingService.updateSharedCollection(
        params.id,
        user.id,
        { title, description }
      )
    }

    return NextResponse.json({ collection: updatedCollection })

  } catch (error) {
    console.error('Update shared collection error:', error)
    return NextResponse.json(
      { error: 'Failed to update shared collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await collectionSharingService.deleteSharedCollection(params.id, user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete shared collection error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shared collection' },
      { status: 500 }
    )
  }
}