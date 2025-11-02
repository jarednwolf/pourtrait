import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/clients.middleware'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(req, res)

  // Only enforce on configured matchers (see config.matcher)
  const { data: { session } } = await supabase.auth.getSession()

  // If not authenticated, send to sign in with return path
  if (!session) {
    const signinUrl = new URL('/auth/signin', req.url)
    signinUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(signinUrl)
  }

  // Onboarding gating: if profile incomplete, redirect to onboarding (except when already there)
  const pathname = req.nextUrl.pathname
  if (!pathname.startsWith('/onboarding')) {
    try {
      // Prefer explicit flag; fall back to presence of palate profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

      let needsOnboarding = profile?.onboarding_completed === false
      if (needsOnboarding === undefined) {
        const { data: palate } = await supabase
          .from('palate_profiles')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle()
        needsOnboarding = !palate
      }

      if (needsOnboarding) {
        const url = new URL('/onboarding/step1', req.url)
        url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
        return NextResponse.redirect(url)
      }
    } catch {
      // On any error, do not block navigation; allow through
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/chat/:path*',
    '/settings/:path*',
    '/profile/:path*',
  ],
}


