import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { dataExportService } from '@/lib/services/data-export'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'create') {
      // Create backup
      const backupData = await dataExportService.createBackup(user.id)
      
      return new NextResponse(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pourtrait-backup-${new Date().toISOString().split('T')[0]}.json"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

    if (action === 'restore') {
      // Restore from backup
      const body = await request.json()
      const { backupData } = body

      if (!backupData) {
        return NextResponse.json(
          { error: 'No backup data provided' },
          { status: 400 }
        )
      }

      await dataExportService.restoreFromBackup(user.id, backupData)

      return NextResponse.json({
        success: true,
        message: 'Data restored successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Backup operation failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { confirmDelete } = body

    if (confirmDelete !== 'DELETE_ALL_DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation' },
        { status: 400 }
      )
    }

    // Delete all user data
    await dataExportService.deleteAllUserData(user.id)

    return NextResponse.json({
      success: true,
      message: 'All user data deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    )
  }
}