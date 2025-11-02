import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Extract Bearer token from Authorization header.
 */
export function getAccessTokenFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!auth) { return null }
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  return token.length > 0 ? token : null
}

/**
 * Create an anon Supabase client that will send the provided access token
 * on all requests (RLS-first; no service-role in user endpoints).
 */
export function createRlsClientWithToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }

  return createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Create an anon client from a NextRequest by extracting the Bearer token.
 * Returns null if the request lacks a valid token.
 */
export function createRlsClientFromRequest(request: NextRequest) {
  const token = getAccessTokenFromRequest(request)
  if (!token) { return null }
  return createRlsClientWithToken(token)
}

/**
 * Validate the user from a request using an anon client.
 * This avoids service-role in user endpoints while still verifying JWT.
 */
export async function getAuthenticatedUserFromRequest(request: NextRequest) {
  const token = getAccessTokenFromRequest(request)
  if (!token) {
    return { user: null, error: new Error('Missing Authorization token') }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: new Error('Supabase env not configured') }
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) {
    return { user: null, error: error || new Error('Invalid authentication') }
  }
  return { user: data.user, error: null }
}


