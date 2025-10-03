import { supabase } from '@/lib/supabase'
import type { 
  Wine, 
  WineInsert, 
  WineUpdate,
  ConsumptionHistoryInsert 
} from '@/lib/supabase'
import type { 
  InventoryFilters, 
  ConsumptionRecord,
  WineInput 
} from '@/types'

export class WineService {
  /**
   * Add a new wine to the user's inventory
   */
  static async addWine(userId: string, wineData: WineInput): Promise<Wine> {
    const wineInsert: WineInsert = {
      user_id: userId,
      name: wineData.name,
      producer: wineData.producer,
      vintage: wineData.vintage,
      region: wineData.region,
      country: wineData.country,
      varietal: wineData.varietal,
      type: wineData.type,
      quantity: wineData.quantity,
      purchase_price: wineData.purchasePrice,
      purchase_date: wineData.purchaseDate?.toISOString().split('T')[0],
      personal_rating: wineData.personalRating,
      personal_notes: wineData.personalNotes,
      image_url: wineData.imageUrl,
      drinking_window: {
        earliestDate: null,
        peakStartDate: null,
        peakEndDate: null,
        latestDate: null,
        currentStatus: 'ready'
      }
    }

    const { data, error } = await supabase
      .from('wines')
      .insert(wineInsert)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add wine: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing wine
   */
  static async updateWine(wineId: string, updates: Partial<WineInput>): Promise<Wine> {
    const wineUpdate: WineUpdate = {}
    
    if (updates.name !== undefined) {
      wineUpdate.name = updates.name
    }
    if (updates.producer !== undefined) {
      wineUpdate.producer = updates.producer
    }
    if (updates.vintage !== undefined) {
      wineUpdate.vintage = updates.vintage
    }
    if (updates.region !== undefined) {
      wineUpdate.region = updates.region
    }
    if (updates.country !== undefined) {
      wineUpdate.country = updates.country
    }
    if (updates.varietal !== undefined) {
      wineUpdate.varietal = updates.varietal
    }
    if (updates.type !== undefined) {
      wineUpdate.type = updates.type
    }
    if (updates.quantity !== undefined) {
      wineUpdate.quantity = updates.quantity
    }
    if (updates.purchasePrice !== undefined) {
      wineUpdate.purchase_price = updates.purchasePrice
    }
    if (updates.purchaseDate !== undefined) {
      wineUpdate.purchase_date = updates.purchaseDate?.toISOString().split('T')[0]
    }
    if (updates.personalRating !== undefined) {
      wineUpdate.personal_rating = updates.personalRating
    }
    if (updates.personalNotes !== undefined) {
      wineUpdate.personal_notes = updates.personalNotes
    }
    if (updates.imageUrl !== undefined) {
      wineUpdate.image_url = updates.imageUrl
    }

    const { data, error } = await supabase
      .from('wines')
      .update(wineUpdate)
      .eq('id', wineId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update wine: ${error.message}`)
    }

    return data
  }

  /**
   * Get user's wine inventory with optional filtering and sorting
   */
  static async getInventory(
    userId: string, 
    filters?: InventoryFilters
  ): Promise<Wine[]> {
    let query = supabase
      .from('wines')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters) {
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type)
      }

      if (filters.region && filters.region.length > 0) {
        query = query.in('region', filters.region)
      }

      if (filters.vintage) {
        if (filters.vintage.min) {
          query = query.gte('vintage', filters.vintage.min)
        }
        if (filters.vintage.max) {
          query = query.lte('vintage', filters.vintage.max)
        }
      }

      if (filters.priceRange) {
        if (filters.priceRange.min) {
          query = query.gte('purchase_price', filters.priceRange.min)
        }
        if (filters.priceRange.max) {
          query = query.lte('purchase_price', filters.priceRange.max)
        }
      }

      if (filters.rating) {
        if (filters.rating.min) {
          query = query.gte('personal_rating', filters.rating.min)
        }
        if (filters.rating.max) {
          query = query.lte('personal_rating', filters.rating.max)
        }
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,producer.ilike.%${filters.search}%,region.ilike.%${filters.search}%`)
      }

      // Apply sorting
      if (filters.sortBy) {
        const column = this.mapSortColumn(filters.sortBy)
        const ascending = filters.sortOrder === 'asc'
        query = query.order(column, { ascending })
      }
    }

    // Default sorting by name if no sort specified
    if (!filters?.sortBy) {
      query = query.order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single wine by ID
   */
  static async getWineById(wineId: string): Promise<Wine | null> {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wineId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Wine not found
      }
      throw new Error(`Failed to fetch wine: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a wine from inventory
   */
  static async deleteWine(wineId: string): Promise<void> {
    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', wineId)

    if (error) {
      throw new Error(`Failed to delete wine: ${error.message}`)
    }
  }

  /**
   * Mark wine as consumed and add to consumption history
   */
  static async markConsumed(
    wineId: string,
    consumedAt: Date,
    rating?: number,
    notes?: string,
    occasion?: string,
    companions?: string[],
    foodPairing?: string
  ): Promise<void> {
    // Get the wine to verify ownership and get user_id
    const wine = await this.getWineById(wineId)
    if (!wine) {
      throw new Error('Wine not found')
    }

    // Create consumption record
    const consumptionRecord: ConsumptionHistoryInsert = {
      user_id: wine.user_id,
      wine_id: wineId,
      consumed_at: consumedAt.toISOString(),
      rating,
      notes,
      occasion,
      companions: companions || [],
      food_pairing: foodPairing
    }

    const { error } = await supabase
      .from('consumption_history')
      .insert(consumptionRecord)

    if (error) {
      throw new Error(`Failed to record consumption: ${error.message}`)
    }

    // Note: Wine quantity is automatically updated by database trigger
  }

  /**
   * Get consumption history for a user
   */
  static async getConsumptionHistory(userId: string): Promise<ConsumptionRecord[]> {
    const { data, error } = await supabase
      .from('consumption_history')
      .select(`
        *,
        wines (
          name,
          producer,
          vintage,
          type,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('consumed_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch consumption history: ${error.message}`)
    }

    // Transform the data to match our ConsumptionRecord type
    return (data || []).map(record => ({
      id: record.id,
      userId: record.user_id,
      wineId: record.wine_id,
      consumedAt: new Date(record.consumed_at),
      rating: record.rating || undefined,
      notes: record.notes || undefined,
      occasion: record.occasion || undefined,
      companions: record.companions || [],
      foodPairing: record.food_pairing || undefined,
      createdAt: new Date(record.created_at)
    }))
  }

  /**
   * Get inventory statistics for a user
   */
  static async getInventoryStats(userId: string) {
    const { data, error } = await supabase
      .from('user_wine_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch inventory stats: ${error.message}`)
    }

    return {
      totalWines: data?.total_wines || 0,
      totalBottles: data?.total_bottles || 0,
      ratedWines: data?.rated_wines || 0,
      averageRating: data?.average_rating || 0,
      redWines: data?.red_wines || 0,
      whiteWines: data?.white_wines || 0,
      sparklingWines: data?.sparkling_wines || 0
    }
  }

  /**
   * Map frontend sort fields to database columns
   */
  private static mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      'name': 'name',
      'producer': 'producer',
      'vintage': 'vintage',
      'rating': 'personal_rating',
      'purchaseDate': 'purchase_date',
      'drinkingWindow': 'drinking_window'
    }

    return columnMap[sortBy] || 'name'
  }
}