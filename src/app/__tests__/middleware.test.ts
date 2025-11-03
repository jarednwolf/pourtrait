import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: vi.fn((_: any) => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } }))
    }
  }))
}))

// Import after mocks
import { middleware } from '@/../middleware'

function makeReq(url: string) {
  return { url } as any
}

describe('middleware auth routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('redirects guest from /dashboard to sign-in with returnTo', async () => {
    const req = makeReq('https://example.com/dashboard')
    const res = await middleware(req)
    // NextResponse.redirect returns an object with headers/location
    // We check the url by stringifying
    expect((res as NextResponse).headers.get('Location')).toContain('/auth/signin?returnTo=%2Fdashboard')
  })

  it('redirects authed user from / to /dashboard', async () => {
    const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs') as any
    createMiddlewareClient.mockImplementation(() => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) }
    }))

    const req = makeReq('https://example.com/')
    const res = await middleware(req)
    expect((res as NextResponse).headers.get('Location')).toContain('/dashboard')
  })
})


