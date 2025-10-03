import { Wine, User, TasteProfile, ConsumptionRecord } from '@/types'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

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
  private supabase = createClient()

  /**
   * Export user's complete wine inventory and data
   */
  async exportUserData(userId: string, options: ExportOptions): Promise<UserDataExport> {
    try {
      // Get user data
      const { data: user } = await this.supabase
        .from('users')
        .select('id, email, name, created_at, experience_level')
        .eq('id', userId)
        .single()

      // Get wine inventory
      const { data: wines } = await this.supabase
        .from('wines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const exportData: UserDataExport = {
        user: user || {},
        wines: wines || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      }

      // Include taste profile if requested
      if (options.includeTasteProfile) {
        const { data: tasteProfile } = await this.supabase
          .from('taste_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (tasteProfile) {
          exportData.tasteProfile = tasteProfile
        }
      }

      // Include consumption history if requested
      if (options.includeConsumptionHistory) {
        const { data: consumptionHistory } = await this.supabase
          .from('consumption_history')
          .select('*')
          .eq('user_id', userId)
          .order('consumed_at', { ascending: false })
        
        if (consumptionHistory) {
          exportData.consumptionHistory = consumptionHistory
        }
      }

      // Remove personal notes if not requested
      if (!options.includePersonalNotes) {
        exportData.wines = exportData.wines.map(wine => ({
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
    if (!wines.length) return ''

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
        wine.purchase_price || '',
        wine.purchase_date || '',
        wine.personal_rating || '',
        wine.drinking_window?.peak_start_date || '',
        wine.drinking_window?.peak_end_date || '',
        wine.drinking_window?.current_status || '',
        this.escapeCsvValue(wine.personal_notes || '')
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
      const { error: deleteWinesError } = await this.supabase
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

        const { error: insertWinesError } = await this.supabase
          .from('wines')
          .insert(winesWithUserId)

        if (insertWinesError) {
          throw new Error('Failed to restore wine data')
        }
      }

      // Restore taste profile if included
      if (backupData.tasteProfile) {
        const { error: upsertProfileError } = await this.supabase
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
        const { error: deleteHistoryError } = await this.supabase
          .from('consumption_history')
          .delete()
          .eq('user_id', userId)

        if (!deleteHistoryError) {
          const historyWithUserId = backupData.consumptionHistory.map(record => ({
            ...record,
            user_id: userId,
            id: undefined
          }))

          const { error: insertHistoryError } = await this.supabase
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
        this.supabase.from('consumption_history').delete().eq('user_id', userId),
        this.supabase.from('recommendations').delete().eq('user_id', userId),
        this.supabase.from('notifications').delete().eq('user_id', userId),
        this.supabase.from('taste_profiles').delete().eq('user_id', userId),
        this.supabase.from('wines').delete().eq('user_id', userId)
      ])

      // Finally delete user profile (handled by Supabase Auth)
      const { error } = await this.supabase.auth.admin.deleteUser(userId)
      
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
        this.supabase.from('wines').select('id').eq('user_id', userId),
        this.supabase.from('consumption_history').select('id').eq('user_id', userId),
        this.supabase.from('taste_profiles').select('id').eq('user_id', userId).single(),
        this.supabase.from('users').select('created_at, updated_at').eq('id', userId).single()
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