import { cookies } from 'next/headers'
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

/**
 * Server-side Supabase helpers for App Router
 * - Use in RSCs: getServerSupabase()
 * - Use in Route Handlers: getRouteHandlerSupabase()
 * - Quick session/user accessors for SSR decisions
 */
export function getServerSupabase() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

export function getRouteHandlerSupabase() {
  const cookieStore = cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}

export async function getServerSession() {
  const supabase = getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getServerUser() {
  const supabase = getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}


