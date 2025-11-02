import { NextRequest, NextResponse } from 'next/server'
import { imageProcessingService } from '@/lib/services/image-processing'
import { createSSRServerClient } from '@/lib/supabase/clients.server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createSSRServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the uploaded file and options
    const formData = await request.formData()
    const file = formData.get('image') as File
    const maxWidth = formData.get('maxWidth') ? parseInt(formData.get('maxWidth') as string) : undefined
    const maxHeight = formData.get('maxHeight') ? parseInt(formData.get('maxHeight') as string) : undefined
    const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : undefined
    const format = formData.get('format') as 'jpeg' | 'png' | 'webp' | undefined
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process and optimize the image
    const result = await imageProcessingService.optimizeAndStoreImage(buffer, {
      maxWidth,
      maxHeight,
      quality,
      format
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Image upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error occurred while uploading the image' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}