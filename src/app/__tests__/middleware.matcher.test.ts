import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
vi.mock('@/lib/supabase/clients.middleware', () => ({ createMiddlewareClient: vi.fn() }))
import { config as middlewareConfig } from '../../../middleware'

describe('Middleware matchers', () => {
  it('includes protected paths', () => {
    const matcher = (middlewareConfig as any).matcher as string[]
    expect(matcher).toContain('/dashboard/:path*')
    expect(matcher).toContain('/inventory/:path*')
    expect(matcher).toContain('/chat/:path*')
    expect(matcher).toContain('/settings/:path*')
    expect(matcher).toContain('/profile/:path*')
  })
})


