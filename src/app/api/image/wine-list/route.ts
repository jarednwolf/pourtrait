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

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('image') as File
    
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

    // Process the wine list
    const result = await imageProcessingService.processWineListImage(buffer)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Wine list processing API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error occurred while processing the wine list' 
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