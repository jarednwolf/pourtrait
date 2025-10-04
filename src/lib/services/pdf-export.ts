import { Wine, UserDataExport } from '@/types'

export interface PDFExportOptions {
  includeImages?: boolean
  includePersonalNotes?: boolean
  groupByType?: boolean
  sortBy?: 'name' | 'vintage' | 'region' | 'type'
}

export class PDFExportService {
  /**
   * Generate PDF content for wine inventory
   * Note: This creates HTML content that can be converted to PDF client-side
   */
  generateInventoryHTML(wines: Wine[], options: PDFExportOptions = {}): string {
    const { groupByType = false, sortBy = 'name', includePersonalNotes = true } = options

    // Sort wines
    const sortedWines = [...wines].sort((a, b) => {
      switch (sortBy) {
        case 'vintage':
          return (b.vintage || 0) - (a.vintage || 0)
        case 'region':
          return (a.region || '').localeCompare(b.region || '')
        case 'type':
          return (a.type || '').localeCompare(b.type || '')
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    // Group by type if requested
    const wineGroups = groupByType ? this.groupWinesByType(sortedWines) : { 'All Wines': sortedWines }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wine Inventory Export</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #8B5A3C;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #8B5A3C;
            margin: 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            margin-top: 5px;
            font-size: 14px;
        }
        .wine-group {
            margin-bottom: 40px;
        }
        .group-title {
            color: #8B5A3C;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .wine-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
            page-break-inside: avoid;
        }
        .wine-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .wine-name {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0;
        }
        .wine-producer {
            font-size: 14px;
            color: #7f8c8d;
            margin: 2px 0;
        }
        .wine-vintage {
            font-size: 18px;
            font-weight: bold;
            color: #8B5A3C;
            margin-left: 10px;
        }
        .wine-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }
        .detail-item {
            font-size: 13px;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .drinking-window {
            background-color: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 12px;
        }
        .status-ready { border-left: 4px solid #28a745; }
        .status-peak { border-left: 4px solid #007bff; }
        .status-declining { border-left: 4px solid #ffc107; }
        .status-over { border-left: 4px solid #dc3545; }
        .status-young { border-left: 4px solid #6c757d; }
        .personal-notes {
            margin-top: 10px;
            padding: 8px;
            background-color: #fff3cd;
            border-radius: 4px;
            font-size: 12px;
            font-style: italic;
        }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .summary h3 {
            color: #8B5A3C;
            margin-top: 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #8B5A3C;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        @media print {
            body { margin: 0; }
            .wine-item { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Wine Inventory</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    ${Object.entries(wineGroups).map(([groupName, groupWines]) => `
        <div class="wine-group">
            ${groupByType ? `<h2 class="group-title">${groupName} (${groupWines.length} bottles)</h2>` : ''}
            
            ${groupWines.map(wine => `
                <div class="wine-item">
                    <div class="wine-header">
                        <div>
                            <h3 class="wine-name">${this.escapeHtml(wine.name || 'Unknown Wine')}</h3>
                            <div class="wine-producer">${this.escapeHtml(wine.producer || '')}</div>
                        </div>
                        <div class="wine-vintage">${wine.vintage || 'NV'}</div>
                    </div>
                    
                    <div class="wine-details">
                        <div class="detail-item">
                            <span class="detail-label">Region:</span> ${this.escapeHtml(wine.region || 'Unknown')}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type:</span> ${this.escapeHtml(wine.type || 'Unknown')}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Varietal:</span> ${this.escapeHtml(Array.isArray(wine.varietal) ? wine.varietal.join(', ') : wine.varietal || 'Unknown')}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Quantity:</span> ${wine.quantity || 0} bottles
                        </div>
                        ${wine.purchase_price ? `
                        <div class="detail-item">
                            <span class="detail-label">Purchase Price:</span> $${wine.purchase_price}
                        </div>
                        ` : ''}
                        ${wine.personal_rating ? `
                        <div class="detail-item">
                            <span class="detail-label">Rating:</span> ${wine.personal_rating}/10
                        </div>
                        ` : ''}
                    </div>
                    
                    ${wine.drinking_window ? `
                    <div class="drinking-window status-${wine.drinking_window.current_status?.replace('_', '-') || 'unknown'}">
                        <strong>Drinking Window:</strong> 
                        ${wine.drinking_window.peak_start_date ? new Date(wine.drinking_window.peak_start_date).getFullYear() : 'Unknown'} - 
                        ${wine.drinking_window.peak_end_date ? new Date(wine.drinking_window.peak_end_date).getFullYear() : 'Unknown'}
                        <br>
                        <strong>Status:</strong> ${this.formatDrinkingStatus(wine.drinking_window.current_status)}
                    </div>
                    ` : ''}
                    
                    ${includePersonalNotes && wine.personal_notes ? `
                    <div class="personal-notes">
                        <strong>Notes:</strong> ${this.escapeHtml(wine.personal_notes)}
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <div class="summary">
        <h3>Collection Summary</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${wines.length}</div>
                <div class="stat-label">Total Wines</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${wines.reduce((sum, wine) => sum + (wine.quantity || 0), 0)}</div>
                <div class="stat-label">Total Bottles</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${new Set(wines.map(w => w.region)).size}</div>
                <div class="stat-label">Regions</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${new Set(wines.map(w => w.producer)).size}</div>
                <div class="stat-label">Producers</div>
            </div>
        </div>
    </div>
</body>
</html>`

    return html
  }

  /**
   * Generate complete user data export as HTML
   */
  generateCompleteExportHTML(exportData: UserDataExport, options: PDFExportOptions = {}): string {
    const inventoryHTML = this.generateInventoryHTML(exportData.wines, options)
    
    // Add additional sections for complete export
    const additionalSections = `
    ${exportData.tasteProfile ? this.generateTasteProfileHTML(exportData.tasteProfile) : ''}
    ${exportData.consumptionHistory ? this.generateConsumptionHistoryHTML(exportData.consumptionHistory) : ''}
    `

    return inventoryHTML.replace('</body>', `${additionalSections}</body>`)
  }

  private groupWinesByType(wines: Wine[]): Record<string, Wine[]> {
    return wines.reduce((groups, wine) => {
      const type = wine.type || 'Unknown'
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1)
      
      if (!groups[capitalizedType]) {
        groups[capitalizedType] = []
      }
      groups[capitalizedType].push(wine)
      return groups
    }, {} as Record<string, Wine[]>)
  }

  private generateTasteProfileHTML(tasteProfile: any): string {
    return `
    <div class="summary">
        <h3>Taste Profile</h3>
        <div class="wine-details">
            <div class="detail-item">
                <span class="detail-label">Experience Level:</span> ${tasteProfile.experience_level || 'Not specified'}
            </div>
            <div class="detail-item">
                <span class="detail-label">Profile Created:</span> ${new Date(tasteProfile.created_at).toLocaleDateString()}
            </div>
        </div>
        ${tasteProfile.preferences ? `
        <div style="margin-top: 15px;">
            <strong>Preferences:</strong>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; overflow-wrap: break-word;">${JSON.stringify(tasteProfile.preferences, null, 2)}</pre>
        </div>
        ` : ''}
    </div>
    `
  }

  private generateConsumptionHistoryHTML(history: any[]): string {
    return `
    <div class="summary">
        <h3>Consumption History</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${history.length}</div>
                <div class="stat-label">Wines Consumed</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${history.filter(h => h.rating).length}</div>
                <div class="stat-label">Wines Rated</div>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            ${history.slice(0, 10).map(record => `
                <div class="wine-item" style="margin-bottom: 10px;">
                    <strong>${this.escapeHtml(record.wine_name || 'Unknown Wine')}</strong>
                    <div style="font-size: 12px; color: #666;">
                        Consumed: ${new Date(record.consumed_at).toLocaleDateString()}
                        ${record.rating ? ` | Rating: ${record.rating}/10` : ''}
                    </div>
                    ${record.notes ? `<div style="font-size: 12px; margin-top: 5px;">${this.escapeHtml(record.notes)}</div>` : ''}
                </div>
            `).join('')}
            ${history.length > 10 ? `<div style="text-align: center; color: #666; font-size: 12px;">... and ${history.length - 10} more</div>` : ''}
        </div>
    </div>
    `
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private formatDrinkingStatus(status?: string): string {
    if (!status) {return 'Unknown'}
    
    const statusMap: Record<string, string> = {
      'too_young': 'Too Young',
      'ready': 'Ready to Drink',
      'peak': 'At Peak',
      'declining': 'Declining',
      'over_hill': 'Past Prime'
    }
    
    return statusMap[status] || status
  }
}

export const pdfExportService = new PDFExportService()