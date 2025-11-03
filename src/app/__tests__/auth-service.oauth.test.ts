import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '@/lib/auth'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(async () => ({ data: {}, error: null }))
    }
  }
}))

describe('AuthService.signInWithProvider', () => {
  const originalLocation = global.window.location

  beforeEach(() => {
    // @ts-expect-error override for tests
    delete (global as any).window.location
    // @ts-expect-error override for tests
    ;(global as any).window.location = {
      origin: 'https://example.com',
      search: '?returnTo=/inventory'
    }
  })

  it('includes next param from returnTo when present', async () => {
    const { supabase } = await import('@/lib/supabase') as any
    const spy = supabase.auth.signInWithOAuth
    await AuthService.signInWithProvider('google')
    expect(spy).toHaveBeenCalled()
    const args = spy.mock.calls[0][0]
    expect(args.options.redirectTo).toContain('/auth/callback?next=')
    expect(decodeURIComponent(args.options.redirectTo.split('next=')[1])).toBe('/inventory')
  })

  afterEach(() => {
    // @ts-expect-error restore
    global.window.location = originalLocation
    vi.restoreAllMocks()
  })
})


