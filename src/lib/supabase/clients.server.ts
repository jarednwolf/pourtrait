import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

/**
 * Server Components / Route Handlers: SSR-aware Supabase client.
 * Persists auth via Next.js cookies.
 */
export function createSSRServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}


