import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { dataExportService, DataExportService } from '@/lib/services/data-export'
import { createRlsClientFromRequest } from '@/lib/supabase/api-auth'
function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey)
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) { return { user: null as any, token: null as any } }
  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseServiceClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) { return { user: null as any, token: null as any } }
  return { user, token }
}

export async function POST(request: NextRequest) {
  try {
    const { user, token } = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'create') {
      // Create backup
      // Use RLS-enabled client bound to the bearer token
      const rlsClient = token ? createRlsClientFromRequest(request) : null
      const svc = rlsClient ? new DataExportService(rlsClient as any) : dataExportService
      const backupData = await svc.createBackup(user.id)
      
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
      const rlsClient = token ? createRlsClientFromRequest(request) : null
      const svc = rlsClient ? new DataExportService(rlsClient as any) : dataExportService
      await svc.restoreFromBackup(user.id, backupData)

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
    const { user } = await getAuthenticatedUser(request)
    if (!user) {
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

    // Delete all user data (requires service-role for auth.admin.deleteUser)
    const svc = new DataExportService(getSupabaseServiceClient() as any)
    await svc.deleteAllUserData(user.id)

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