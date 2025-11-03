import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient as createHelpersMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

/**
 * Middleware: SSR-aware Supabase client bound to request/response cookie APIs.
 */
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createHelpersMiddlewareClient<Database>({ req, res })
}



