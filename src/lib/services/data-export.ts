import { Wine, User, TasteProfile, ConsumptionRecord } from '@/types'
import { supabase } from '@/lib/supabase'

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeImages?: boolean
  includePersonalNotes?: boolean
  includeConsumptionHistory?: boolean
  includeTasteProfile?: boolean
}

export interface UserDataExport {
  user: Partial<User>
  wines: Wine[]
  tasteProfile?: TasteProfile
  consumptionHistory?: ConsumptionRecord[]
  exportDate: string
  version: string
}

export class DataExportService {

  /**
   * Export user's complete wine inventory and data
   */
  async exportUserData(userId: string, options: ExportOptions): Promise<UserDataExport> {
    try {
      // Get user data
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id, name, created_at, experience_level')
        .eq('id', userId)
        .single()

      // Get wine inventory
      const { data: wines } = await supabase
        .from('wines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Map DB wines to domain Wine type
      const mapDbWine = (w: any): Wine => ({
        id: w.id,
        userId: w.user_id,
        name: w.name,
        producer: w.producer,
        vintage: w.vintage,
        region: w.region,
        country: w.country,
        varietal: w.varietal || [],
        type: w.type,
        quantity: w.quantity || 0,
        purchasePrice: w.purchase_price,
        purchaseDate: w.purchase_date ? new Date(w.purchase_date) : undefined,
        personalRating: w.personal_rating,
        personalNotes: w.personal_notes,
        imageUrl: w.image_url,
        drinkingWindow: w.drinking_window as any,
        externalData: w.external_data || {},
        createdAt: new Date(w.created_at),
        updatedAt: new Date(w.updated_at)
      })

      const exportData: UserDataExport = {
        user: user || {},
        wines: (wines || []).map(mapDbWine),
        exportDate: new Date().toISOString(),
        version: '1.0'
      }

      // Include taste profile if requested
      if (options.includeTasteProfile) {
        const { data: tasteProfile } = await supabase
          .from('taste_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (tasteProfile) {
          exportData.tasteProfile = {
            userId: tasteProfile.user_id,
            redWinePreferences: tasteProfile.red_wine_preferences as any,
            whiteWinePreferences: tasteProfile.white_wine_preferences as any,
            sparklingPreferences: tasteProfile.sparkling_preferences as any,
            generalPreferences: tasteProfile.general_preferences as any,
            learningHistory: tasteProfile.learning_history as any,
            confidenceScore: tasteProfile.confidence_score ?? 0,
            lastUpdated: new Date(tasteProfile.last_updated || new Date().toISOString())
          }
        }
      }

      // Include consumption history if requested
      if (options.includeConsumptionHistory) {
        const { data: consumptionHistory } = await supabase
          .from('consumption_history')
          .select('*')
          .eq('user_id', userId)
          .order('consumed_at', { ascending: false })
        
        if (consumptionHistory) {
          exportData.consumptionHistory = consumptionHistory.map(h => ({
            id: h.id,
            userId: h.user_id,
            wineId: h.wine_id,
            rating: h.rating ?? undefined,
            notes: h.notes ?? undefined,
            consumedAt: new Date(h.consumed_at),
            occasion: h.occasion ?? undefined,
            foodPairing: h.food_pairing ?? undefined,
            companions: h.companions ?? undefined,
            createdAt: new Date(h.created_at)
          }))
        }
      }

      // Remove personal notes if not requested
      if (!options.includePersonalNotes) {
        exportData.wines = exportData.wines.map((wine: any) => ({
          ...wine,
          personal_notes: undefined
        }))
      }

      return exportData
    } catch (error) {
      console.error('Error exporting user data:', error)
      throw new Error('Failed to export user data')
    }
  }

  /**
   * Convert wine data to CSV format
   */
  exportToCSV(wines: Wine[]): string {
    if (!wines.length) {return ''}

    const headers = [
      'Name',
      'Producer',
      'Vintage',
      'Region',
      'Country',
      'Varietal',
      'Type',
      'Quantity',
      'Purchase Price',
      'Purchase Date',
      'Personal Rating',
      'Drinking Window Start',
      'Drinking Window End',
      'Current Status',
      'Personal Notes'
    ]

    const csvRows = [
      headers.join(','),
      ...wines.map(wine => [
        this.escapeCsvValue(wine.name || ''),
        this.escapeCsvValue(wine.producer || ''),
        wine.vintage || '',
        this.escapeCsvValue(wine.region || ''),
        this.escapeCsvValue(wine.country || ''),
        this.escapeCsvValue(Array.isArray(wine.varietal) ? wine.varietal.join('; ') : wine.varietal || ''),
        wine.type || '',
        wine.quantity || 0,
        wine.purchasePrice || '',
        wine.purchaseDate || '',
        wine.personalRating || '',
        wine.drinkingWindow?.peakStartDate || '',
        wine.drinkingWindow?.peakEndDate || '',
        wine.drinkingWindow?.currentStatus || '',
        this.escapeCsvValue(wine.personalNotes || '')
      ].join(','))
    ]

    return csvRows.join('\n')
  }

  /**
   * Convert data to JSON format
   */
  exportToJSON(data: UserDataExport): string {
    return JSON.stringify(data, null, 2)
  }

  /**
   * Generate backup data with metadata
   */
  async createBackup(userId: string): Promise<UserDataExport> {
    const options: ExportOptions = {
      format: 'json',
      includeImages: false, // Images stored separately
      includePersonalNotes: true,
      includeConsumptionHistory: true,
      includeTasteProfile: true
    }

    return this.exportUserData(userId, options)
  }

  /**
   * Restore user data from backup
   */
  async restoreFromBackup(userId: string, backupData: UserDataExport): Promise<void> {
    try {
      // Validate backup data
      if (!backupData.wines || !Array.isArray(backupData.wines)) {
        throw new Error('Invalid backup data format')
      }

      // Start transaction-like operations
      const { error: deleteWinesError } = await supabase
        .from('wines')
        .delete()
        .eq('user_id', userId)

      if (deleteWinesError) {
        throw new Error('Failed to clear existing wine data')
      }

      // Restore wines
      if (backupData.wines.length > 0) {
        const winesWithUserId = backupData.wines.map(wine => ({
          ...wine,
          user_id: userId,
          id: undefined // Let database generate new IDs
        }))

        const { error: insertWinesError } = await supabase
          .from('wines')
          .insert(winesWithUserId)

        if (insertWinesError) {
          throw new Error('Failed to restore wine data')
        }
      }

      // Restore taste profile if included
      if (backupData.tasteProfile) {
        const { error: upsertProfileError } = await supabase
          .from('taste_profiles')
          .upsert({
            ...backupData.tasteProfile,
            user_id: userId
          })

        if (upsertProfileError) {
          console.error('Failed to restore taste profile:', upsertProfileError)
        }
      }

      // Restore consumption history if included
      if (backupData.consumptionHistory && backupData.consumptionHistory.length > 0) {
        const { error: deleteHistoryError } = await supabase
          .from('consumption_history')
          .delete()
          .eq('user_id', userId)

        if (!deleteHistoryError) {
          const historyWithUserId = backupData.consumptionHistory.map(record => ({
            user_id: userId,
            wine_id: record.wineId,
            consumed_at: record.consumedAt.toISOString(),
            rating: record.rating,
            notes: record.notes,
            occasion: record.occasion,
            food_pairing: record.foodPairing,
            companions: record.companions
          }))

          const { error: insertHistoryError } = await supabase
            .from('consumption_history')
            .insert(historyWithUserId)

          if (insertHistoryError) {
            console.error('Failed to restore consumption history:', insertHistoryError)
          }
        }
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw new Error('Failed to restore data from backup')
    }
  }

  /**
   * Delete all user data (GDPR compliance)
   */
  async deleteAllUserData(userId: string): Promise<void> {
    try {
      // Delete in order to respect foreign key constraints
      await Promise.all([
        supabase.from('consumption_history').delete().eq('user_id', userId),
        supabase.from('recommendations').delete().eq('user_id', userId),
        supabase.from('notifications').delete().eq('user_id', userId),
        supabase.from('taste_profiles').delete().eq('user_id', userId),
        supabase.from('wines').delete().eq('user_id', userId)
      ])

      // Finally delete user profile (handled by Supabase Auth)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) {
        console.error('Error deleting user account:', error)
        throw new Error('Failed to delete user account')
      }
    } catch (error) {
      console.error('Error deleting user data:', error)
      throw new Error('Failed to delete user data')
    }
  }

  /**
   * Get data export statistics
   */
  async getExportStats(userId: string): Promise<{
    totalWines: number
    totalConsumptionRecords: number
    hasTasteProfile: boolean
    accountCreated: string
    lastActivity: string
  }> {
    try {
      const [winesResult, historyResult, profileResult, userResult] = await Promise.all([
        supabase.from('wines').select('id').eq('user_id', userId),
        supabase.from('consumption_history').select('id').eq('user_id', userId),
        supabase.from('taste_profiles').select('id').eq('user_id', userId).single(),
        supabase.from('user_profiles').select('created_at, updated_at').eq('id', userId).single()
      ])

      return {
        totalWines: winesResult.data?.length || 0,
        totalConsumptionRecords: historyResult.data?.length || 0,
        hasTasteProfile: !!profileResult.data,
        accountCreated: userResult.data?.created_at || '',
        lastActivity: userResult.data?.updated_at || ''
      }
    } catch (error) {
      console.error('Error getting export stats:', error)
      throw new Error('Failed to get export statistics')
    }
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}

export const dataExportService = new DataExportService()