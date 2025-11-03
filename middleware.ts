import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const url = new URL(req.url)
  const path = url.pathname

  const isAuthed = !!session
  const authOnly = new Set(['/dashboard', '/inventory', '/chat', '/settings', '/profile'])

  // Authenticated visits to "/" should land on dashboard
  if (isAuthed && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Guests visiting auth-only routes should be redirected to sign-in with returnTo
  if (!isAuthed && authOnly.has(path)) {
    const returnTo = encodeURIComponent(`${path}${url.search}`)
    return NextResponse.redirect(new URL(`/auth/signin?returnTo=${returnTo}`, req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/dashboard', '/inventory', '/chat', '/settings', '/profile']
}


