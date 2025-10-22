import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { dataExportService, ExportOptions } from '@/lib/services/data-export'
import { pdfExportService } from '@/lib/services/pdf-export'

export const runtime = 'nodejs'

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey)
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) { return { user: null } }
  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseServiceClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) { return { user: null } }
  return { user }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format, options = {} } = body as {
      format: 'csv' | 'json' | 'pdf'
      options: ExportOptions
    }

    // Export user data
    const exportData = await dataExportService.exportUserData(user.id, {
      ...options,
      format
    })

    let responseData: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        responseData = dataExportService.exportToCSV(exportData.wines)
        contentType = 'text/csv'
        filename = `wine-inventory-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'json':
        responseData = dataExportService.exportToJSON(exportData)
        contentType = 'application/json'
        filename = `wine-data-backup-${new Date().toISOString().split('T')[0]}.json`
        break

      case 'pdf':
        responseData = pdfExportService.generateInventoryHTML(exportData.wines, options)
        contentType = 'text/html'
        filename = `wine-inventory-${new Date().toISOString().split('T')[0]}.html`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        )
    }

    // Return the data with appropriate headers
    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)
    if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    // Get export statistics
    const stats = await dataExportService.getExportStats(user.id)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Export stats error:', error)
    // Return zeros on error rather than failing
    return NextResponse.json({
      totalWines: 0,
      totalConsumptionRecords: 0,
      hasTasteProfile: false,
      accountCreated: '',
      lastActivity: ''
    })
  }
}