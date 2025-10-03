import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dataExportService, ExportOptions } from '@/lib/services/data-export'
import { pdfExportService } from '@/lib/services/pdf-export'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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

    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get export statistics
    const stats = await dataExportService.getExportStats(user.id)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Export stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get export statistics' },
      { status: 500 }
    )
  }
}