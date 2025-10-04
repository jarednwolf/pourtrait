import { Wine } from '@/types'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export interface SharedCollection {
  id: string
  userId: string
  title: string
  description?: string
  wines: Wine[]
  isPublic: boolean
  shareToken: string
  createdAt: Date
  updatedAt: Date
  viewCount: number
}

export interface ShareOptions {
  title: string
  description?: string
  includePersonalNotes?: boolean
  includeRatings?: boolean
  wineIds?: string[] // If not provided, shares all wines
}

export class CollectionSharingService {
  private getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  /**
   * Create a shareable collection
   */
  async createSharedCollection(userId: string, options: ShareOptions): Promise<SharedCollection> {
    try {
      // Generate unique share token
      const shareToken = this.generateShareToken()

      // Get wines to share
      const supabase = this.getSupabaseClient()
      let winesQuery = supabase
        .from('wines')
        .select('*')
        .eq('user_id', userId)

      if (options.wineIds && options.wineIds.length > 0) {
        winesQuery = winesQuery.in('id', options.wineIds)
      }

      const { data: wines, error: winesError } = await winesQuery

      if (winesError) {
        throw new Error('Failed to fetch wines for sharing')
      }

      // Filter out personal data if not included
      const filteredWines = wines?.map(wine => ({
        ...wine,
        personal_notes: options.includePersonalNotes ? wine.personal_notes : undefined,
        personal_rating: options.includeRatings ? wine.personal_rating : undefined,
        purchase_price: undefined, // Never share purchase prices
        purchase_date: undefined
      })) || []

      // Create shared collection record
      const { data: sharedCollection, error: createError } = await supabase
        .from('shared_collections')
        .insert({
          user_id: userId,
          title: options.title,
          description: options.description,
          wines: filteredWines,
          is_public: false, // Start as private
          share_token: shareToken,
          view_count: 0
        })
        .select()
        .single()

      if (createError) {
        throw new Error('Failed to create shared collection')
      }

      return {
        id: sharedCollection.id,
        userId: sharedCollection.user_id,
        title: sharedCollection.title,
        description: sharedCollection.description ?? undefined,
        wines: (sharedCollection.wines as any[]) || [],
        isPublic: !!sharedCollection.is_public,
        shareToken: (sharedCollection as any).share_token,
        createdAt: new Date(sharedCollection.created_at || new Date().toISOString()),
        updatedAt: new Date(sharedCollection.updated_at || new Date().toISOString()),
        viewCount: sharedCollection.view_count || 0
      }

    } catch (error) {
      console.error('Error creating shared collection:', error)
      throw new Error('Failed to create shared collection')
    }
  }

  /**
   * Get shared collection by token
   */
  async getSharedCollection(shareToken: string): Promise<SharedCollection | null> {
    try {
      const supabase = this.getSupabaseClient()
      const { data: collection, error } = await supabase
        .from('shared_collections')
        .select('*')
        .eq('share_token', shareToken)
        .single()

      if (error || !collection) {
        return null
      }

      // Increment view count
      await supabase
        .from('shared_collections')
        .update({ view_count: collection.view_count + 1 })
        .eq('id', collection.id)

      return collection as SharedCollection

    } catch (error) {
      console.error('Error fetching shared collection:', error)
      return null
    }
  }

  /**
   * Get user's shared collections
   */
  async getUserSharedCollections(userId: string): Promise<SharedCollection[]> {
    try {
      const supabase = this.getSupabaseClient()
      const { data: collections, error } = await supabase
        .from('shared_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Failed to fetch shared collections')
      }

      return (collections || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        title: c.title,
        description: c.description ?? undefined,
        wines: (c.wines as any[]) || [],
        isPublic: !!c.is_public,
        shareToken: c.share_token,
        createdAt: new Date(c.created_at || new Date().toISOString()),
        updatedAt: new Date(c.updated_at || new Date().toISOString()),
        viewCount: c.view_count || 0
      }))

    } catch (error) {
      console.error('Error fetching user shared collections:', error)
      throw new Error('Failed to fetch shared collections')
    }
  }

  /**
   * Update shared collection
   */
  async updateSharedCollection(
    collectionId: string, 
    userId: string, 
    updates: Partial<ShareOptions>
  ): Promise<SharedCollection> {
    try {
      const supabase = this.getSupabaseClient()
      const { data: collection, error } = await supabase
        .from('shared_collections')
        .update({
          title: updates.title,
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to update shared collection')
      }

      return {
        id: collection.id,
        userId: collection.user_id,
        title: collection.title,
        description: collection.description ?? undefined,
        wines: (collection.wines as any[]) || [],
        isPublic: !!collection.is_public,
        shareToken: collection.share_token,
        createdAt: new Date(collection.created_at || new Date().toISOString()),
        updatedAt: new Date(collection.updated_at || new Date().toISOString()),
        viewCount: collection.view_count || 0
      }

    } catch (error) {
      console.error('Error updating shared collection:', error)
      throw new Error('Failed to update shared collection')
    }
  }

  /**
   * Delete shared collection
   */
  async deleteSharedCollection(collectionId: string, userId: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()
      const { error } = await supabase
        .from('shared_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId)

      if (error) {
        throw new Error('Failed to delete shared collection')
      }

    } catch (error) {
      console.error('Error deleting shared collection:', error)
      throw new Error('Failed to delete shared collection')
    }
  }

  /**
   * Toggle collection visibility
   */
  async toggleCollectionVisibility(
    collectionId: string, 
    userId: string, 
    isPublic: boolean
  ): Promise<SharedCollection> {
    try {
      const { data: collection, error } = await this.supabase
        .from('shared_collections')
        .update({ is_public: isPublic })
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to update collection visibility')
      }

      return collection as SharedCollection

    } catch (error) {
      console.error('Error updating collection visibility:', error)
      throw new Error('Failed to update collection visibility')
    }
  }

  /**
   * Generate share URL
   */
  getShareUrl(shareToken: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://pourtrait.app'
    
    return `${baseUrl}/shared/${shareToken}`
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}

export const collectionSharingService = new CollectionSharingService()