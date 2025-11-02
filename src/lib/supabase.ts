import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Re-export createClient for use in other modules
export { createClient }

// Function to create client-side Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }
  return createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  })
}

// Default client instance for backwards compatibility
export const supabase = createSupabaseClient()

// Server-side client for admin operations
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
  }
  return createClient<Database>(supabaseUrl as string, serviceRoleKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Type-safe table references
export type Tables = Database['public']['Tables']
export type UserProfile = Tables['user_profiles']['Row']
export type UserProfileInsert = Tables['user_profiles']['Insert']
export type UserProfileUpdate = Tables['user_profiles']['Update']

export type Wine = Tables['wines']['Row']
export type WineInsert = Tables['wines']['Insert']
export type WineUpdate = Tables['wines']['Update']

export type TasteProfile = Tables['taste_profiles']['Row']
export type TasteProfileInsert = Tables['taste_profiles']['Insert']
export type TasteProfileUpdate = Tables['taste_profiles']['Update']

export type Recommendation = Tables['recommendations']['Row']
export type RecommendationInsert = Tables['recommendations']['Insert']
export type RecommendationUpdate = Tables['recommendations']['Update']

export type ConsumptionHistory = Tables['consumption_history']['Row']
export type ConsumptionHistoryInsert = Tables['consumption_history']['Insert']

export type DrinkingPartner = Tables['drinking_partners']['Row']
export type DrinkingPartnerInsert = Tables['drinking_partners']['Insert']
export type DrinkingPartnerUpdate = Tables['drinking_partners']['Update']

export type Notification = Tables['notifications']['Row']
export type NotificationInsert = Tables['notifications']['Insert']
export type NotificationUpdate = Tables['notifications']['Update']