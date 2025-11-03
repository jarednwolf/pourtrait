import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth, useIsAuthenticated, useUserProfile, useAuthLoading } from '../useAuth'
import { AuthProvider } from '@/components/providers/AuthProvider'

// Drive auth state via internal hook mock
let mockAuthState: any
vi.mock('@/hooks/useAuthInternal', () => ({
  useAuthInternal: () => mockAuthState
}))

function withProvider(ui: any) {
  return {
    wrapper: ({ children }: any) => (
      <AuthProvider initialSession={null} initialUser={null}>{children}</AuthProvider>
    )
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with loading state', () => {
    mockAuthState = {
      user: null,
      session: null,
      loading: true,
      initialized: false,
      signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn(),
    }
    const { result } = renderHook(() => useAuth(), withProvider(null))
    expect(result.current.loading).toBe(true)
    expect(result.current.initialized).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('should set user and session when authenticated', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', profile: { id: 'user-123' } }
    const mockSession = { access_token: 'token', user: mockUser }
    mockAuthState = {
      user: mockUser,
      session: mockSession,
      loading: false,
      initialized: true,
      signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn(),
    }
    const { result } = renderHook(() => useAuth(), withProvider(null))
    expect(result.current.initialized).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession as any)
  })

  it('should handle sign out', async () => {
    const signOut = vi.fn()
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut, refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useAuth(), withProvider(null))
    await act(async () => { await result.current.signOut() })
    expect(signOut).toHaveBeenCalled()
  })

  it('should refresh user data', async () => {
    const refreshUser = vi.fn()
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut: vi.fn(), refreshUser, getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useAuth(), withProvider(null))
    await act(async () => { await result.current.refreshUser() })
    expect(refreshUser).toHaveBeenCalled()
  })

  it('should handle authentication errors gracefully', () => {
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useAuth(), withProvider(null))
    expect(result.current.initialized).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })
})

describe('useIsAuthenticated', () => {
  it('should return false when not authenticated', () => {
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useIsAuthenticated(), withProvider(null))
    expect(result.current).toBe(false)
  })

  it('should return true when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }

    mockAuthState = { user: mockUser, session: { access_token: 'token' }, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useIsAuthenticated(), withProvider(null))
    expect(result.current).toBe(true)
  })
})

describe('useUserProfile', () => {
  it('should return user profile when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }

    mockAuthState = { user: mockUser, session: { access_token: 'token' }, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useUserProfile(), withProvider(null))
    expect(result.current.profile).toEqual(mockUser.profile)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should return null profile when not authenticated', async () => {
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useUserProfile(), withProvider(null))
    expect(result.current.profile).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe('useAuthLoading', () => {
  it('should return true when loading', () => {
    mockAuthState = { user: null, session: null, loading: true, initialized: false, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useAuthLoading(), withProvider(null))
    expect(result.current).toBe(true)
  })

  it('should return false when loaded', async () => {
    mockAuthState = { user: null, session: null, loading: false, initialized: true, signOut: vi.fn(), refreshUser: vi.fn(), getAccessToken: vi.fn(), refreshProfile: vi.fn() }
    const { result } = renderHook(() => useAuthLoading(), withProvider(null))
    expect(result.current).toBe(false)
  })
})