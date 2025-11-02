import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/**
 * Browser-side Supabase client using @supabase/ssr.
 * Intended for use in client components and hooks.
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail fast in non-test environments to surface misconfiguration
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }

  return createBrowserClient<Database>(
    supabaseUrl as string,
    supabaseAnonKey as string
  )
}


