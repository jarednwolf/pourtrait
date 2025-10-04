import { Wine, WineInput, DrinkingWindow } from '@/types'
import { DrinkingWindowService } from './drinking-window'
import { supabase } from '@/lib/supabase'

/**
 * Enhanced wine service that includes drinking window calculation
 */
export class EnhancedWineService {
  /**
   * Create a new wine with calculated drinking window
   */
  static async createWine(userId: string, wineInput: WineInput): Promise<Wine> {
    // Calculate drinking window for the new wine
    const drinkingWindow = DrinkingWindowService.calculateDrinkingWindow({
      ...wineInput,
      userId,
      id: '', // Will be set by database
      createdAt: new Date(),
      updatedAt: new Date(),
      externalData: {}
    })
    
    // Insert wine with drinking window
    const { data, error } = await supabase
      .from('wines')
      .insert({
        user_id: userId,
        name: wineInput.name,
        producer: wineInput.producer,
        vintage: wineInput.vintage,
        region: wineInput.region,
        country: wineInput.country,
        varietal: wineInput.varietal,
        type: wineInput.type,
        quantity: wineInput.quantity,
        purchase_price: wineInput.purchasePrice,
        purchase_date: wineInput.purchaseDate?.toISOString(),
        personal_rating: wineInput.personalRating,
        personal_notes: wineInput.personalNotes,
        image_url: wineInput.imageUrl,
        drinking_window: (drinkingWindow as any),
        external_data: {}
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create wine:', error)
      throw error
    }
    
    return this.mapDatabaseWineToWine(data)
  }
  
  /**
   * Update an existing wine and recalculate drinking window if needed
   */
  static async updateWine(wineId: string, updates: Partial<WineInput>): Promise<Wine> {
    // Get current wine data
    const { data: currentWine, error: fetchError } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wineId)
      .single()
    
    if (fetchError) {
      console.error('Failed to fetch wine for update:', fetchError)
      throw fetchError
    }
    
    // Check if we need to recalculate drinking window
    const needsRecalculation = 
      updates.vintage !== undefined ||
      updates.type !== undefined ||
      updates.region !== undefined ||
      updates.producer !== undefined
    
    let drinkingWindow = currentWine.drinking_window as any
    
    if (needsRecalculation) {
      // Merge current data with updates for calculation
      const wineForCalculation = {
        ...this.mapDatabaseWineToWine(currentWine),
        ...updates
      }
      
      drinkingWindow = DrinkingWindowService.calculateDrinkingWindow(wineForCalculation)
    } else {
      // Just update the status of existing drinking window
      drinkingWindow = DrinkingWindowService.updateDrinkingWindowStatus(currentWine.drinking_window as any)
    }
    
    // Update wine in database
    const { data, error } = await supabase
      .from('wines')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.producer && { producer: updates.producer }),
        ...(updates.vintage && { vintage: updates.vintage }),
        ...(updates.region && { region: updates.region }),
        ...(updates.country && { country: updates.country }),
        ...(updates.varietal && { varietal: updates.varietal }),
        ...(updates.type && { type: updates.type }),
        ...(updates.quantity !== undefined && { quantity: updates.quantity }),
        ...(updates.purchasePrice !== undefined && { purchase_price: updates.purchasePrice }),
        ...(updates.purchaseDate && { purchase_date: updates.purchaseDate.toISOString() }),
        ...(updates.personalRating !== undefined && { personal_rating: updates.personalRating }),
        ...(updates.personalNotes !== undefined && { personal_notes: updates.personalNotes }),
        ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl }),
        drinking_window: (drinkingWindow as any),
        updated_at: new Date().toISOString()
      })
      .eq('id', wineId)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update wine:', error)
      throw error
    }
    
    return this.mapDatabaseWineToWine(data)
  }
  
  /**
   * Get wines with updated drinking window status
   */
  static async getUserWinesWithUpdatedStatus(userId: string): Promise<Wine[]> {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch wines:', error)
      throw error
    }
    
    // Update drinking window status for all wines
    const winesWithUpdatedStatus = data.map(wine => {
      const mappedWine = this.mapDatabaseWineToWine(wine)
      const updatedDrinkingWindow = DrinkingWindowService.updateDrinkingWindowStatus(
        mappedWine.drinkingWindow
      )
      
      return {
        ...mappedWine,
        drinkingWindow: updatedDrinkingWindow
      }
    })
    
    // Batch update wines with changed status (optional optimization)
    const winesToUpdate = winesWithUpdatedStatus.filter((wine, index) =>
      wine.drinkingWindow.currentStatus !== ((data[index].drinking_window as any)?.currentStatus)
    )
    
    if (winesToUpdate.length > 0) {
      // Update drinking window status in database for changed wines
      await Promise.all(
        winesToUpdate.map(wine =>
          supabase
            .from('wines')
            .update({ drinking_window: (wine.drinkingWindow as any) })
            .eq('id', wine.id)
        )
      )
    }
    
    return winesWithUpdatedStatus
  }
  
  /**
   * Get wines that need drinking window alerts
   */
  static async getWinesNeedingAlerts(userId: string): Promise<{
    enteringPeak: Wine[]
    leavingPeak: Wine[]
    overHill: Wine[]
  }> {
    const wines = await this.getUserWinesWithUpdatedStatus(userId)
    return DrinkingWindowService.getWinesNeedingAlerts(wines)
  }
  
  /**
   * Bulk update drinking window status for all wines (for scheduled jobs)
   */
  static async updateAllDrinkingWindowStatuses(): Promise<void> {
    try {
      // Get all wines in batches
      let offset = 0
      const batchSize = 100
      
      while (true) {
        const { data: wines, error } = await supabase
          .from('wines')
          .select('id, drinking_window')
          .range(offset, offset + batchSize - 1)
        
        if (error) {
          console.error('Failed to fetch wines for status update:', error)
          break
        }
        
        if (!wines || wines.length === 0) {
          break
        }
        
        // Update status for each wine
      const updates = wines.map(wine => {
          const updatedDrinkingWindow = DrinkingWindowService.updateDrinkingWindowStatus(
            wine.drinking_window as any
          )
          
          return supabase
            .from('wines')
            .update({ drinking_window: (updatedDrinkingWindow as any) })
            .eq('id', wine.id)
        })
        
        await Promise.all(updates)
        
        offset += batchSize
      }
    } catch (error) {
      console.error('Failed to update drinking window statuses:', error)
    }
  }
  
  /**
   * Map database wine record to Wine type
   */
  private static mapDatabaseWineToWine(dbWine: any): Wine {
    return {
      id: dbWine.id,
      userId: dbWine.user_id,
      name: dbWine.name,
      producer: dbWine.producer,
      vintage: dbWine.vintage,
      region: dbWine.region,
      country: dbWine.country,
      varietal: dbWine.varietal || [],
      type: dbWine.type,
      quantity: dbWine.quantity || 0,
      purchasePrice: dbWine.purchase_price,
      purchaseDate: dbWine.purchase_date ? new Date(dbWine.purchase_date) : undefined,
      drinkingWindow: dbWine.drinking_window as DrinkingWindow,
      personalRating: dbWine.personal_rating,
      personalNotes: dbWine.personal_notes,
      imageUrl: dbWine.image_url,
      externalData: dbWine.external_data || {},
      createdAt: new Date(dbWine.created_at),
      updatedAt: new Date(dbWine.updated_at)
    }
  }
}

/**
 * Hook for using enhanced wine service in React components
 */
export function useEnhancedWineService(userId: string) {
  const createWine = async (wineInput: WineInput): Promise<Wine> => {
    return EnhancedWineService.createWine(userId, wineInput)
  }
  
  const updateWine = async (wineId: string, updates: Partial<WineInput>): Promise<Wine> => {
    return EnhancedWineService.updateWine(wineId, updates)
  }
  
  const getUserWines = async (): Promise<Wine[]> => {
    return EnhancedWineService.getUserWinesWithUpdatedStatus(userId)
  }
  
  const getWinesNeedingAlerts = async () => {
    return EnhancedWineService.getWinesNeedingAlerts(userId)
  }
  
  return {
    createWine,
    updateWine,
    getUserWines,
    getWinesNeedingAlerts
  }
}