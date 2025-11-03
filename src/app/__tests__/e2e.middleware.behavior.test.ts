import { describe, it, expect, vi } from 'vitest'

let clientMock: any

vi.mock('@/lib/supabase/clients.middleware', () => ({
  createMiddlewareClient: () => clientMock
}))

// Mock NextResponse from next/server
vi.mock('next/server', async () => {
  const actual = await vi.importActual<any>('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: (url: any) => ({ redirected: true, headers: new Headers(), cookies: { set: vi.fn() }, url }),
      next: () => ({ cookies: { set: vi.fn() } }),
      json: actual.NextResponse?.json,
    }
  }
})

// Import after mocks applied
// eslint-disable-next-line import/first
import { middleware } from '../../../middleware'

function makeReq(pathname: string, origin = 'https://example.com') {
  const url = `${origin}${pathname}`
  return {
    url,
    nextUrl: { pathname, search: '', toString: () => url },
    cookies: { get: (_: string) => undefined }
  } as any
}

describe('middleware behavior', () => {
  it('redirects unauthenticated users to signin with next param', async () => {
    clientMock = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }
    }
    const req = makeReq('/dashboard')
    const res: any = await middleware(req)
    expect(res?.redirected).toBe(true)
    expect(String(res.url)).toMatch(/\/auth\/signin\?next=%2Fdashboard$/)
  })

  it('redirects onboarding-incomplete users to onboarding step1', async () => {
    const session = { user: { id: 'u1' } }
    const selectable = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false } })
    }
    clientMock = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return { select: vi.fn().mockReturnValue(selectable) }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }
      })
    }
    const req = makeReq('/dashboard')
    const res: any = await middleware(req)
    expect(res?.redirected).toBe(true)
    expect(String(res.url)).toMatch(/\/onboarding\/step1\?next=%2Fdashboard$/)
  })

  it('allows authenticated and onboarded users through', async () => {
    const session = { user: { id: 'u1' } }
    const selectable = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: true } })
    }
    clientMock = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session } }) },
      from: vi.fn().mockImplementation((_table: string) => ({ select: vi.fn().mockReturnValue(selectable) }))
    }
    const req = makeReq('/dashboard')
    const res = await middleware(req)
    expect(res).toBeDefined()
    expect(res?.redirected).not.toBe(true)
  })
})


