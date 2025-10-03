import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, useIsAuthenticated, useUserProfile, useAuthLoading } from '../useAuth'
import { AuthService } from '@/lib/auth'

// Mock AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.initialized).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('should set user and session when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }
    const mockSession = { access_token: 'token', user: mockUser }

    vi.mocked(AuthService.getSession).mockResolvedValue(mockSession)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.initialized).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  it('should handle sign out', async () => {
    vi.mocked(AuthService.signOut).mockResolvedValue()

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(AuthService.signOut).toHaveBeenCalled()
  })

  it('should refresh user data', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(AuthService.getSession).mockResolvedValue(null)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.refreshUser()
    })

    expect(AuthService.getCurrentUser).toHaveBeenCalled()
    expect(AuthService.getSession).toHaveBeenCalled()
  })

  it('should handle authentication errors gracefully', async () => {
    vi.mocked(AuthService.getSession).mockRejectedValue(new Error('Auth error'))
    vi.mocked(AuthService.getCurrentUser).mockRejectedValue(new Error('Auth error'))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.initialized).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })
})

describe('useIsAuthenticated', () => {
  it('should return false when not authenticated', () => {
    vi.mocked(AuthService.getSession).mockResolvedValue(null)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null)

    const { result } = renderHook(() => useIsAuthenticated())

    expect(result.current).toBe(false)
  })

  it('should return true when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }

    vi.mocked(AuthService.getSession).mockResolvedValue({ access_token: 'token' } as any)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useIsAuthenticated())

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})

describe('useUserProfile', () => {
  it('should return user profile when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { id: 'user-123', name: 'Test User', experience_level: 'beginner' },
    }

    vi.mocked(AuthService.getSession).mockResolvedValue({ access_token: 'token' } as any)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockUser.profile)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should return null profile when not authenticated', async () => {
    vi.mocked(AuthService.getSession).mockResolvedValue(null)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null)

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe('useAuthLoading', () => {
  it('should return true when loading', () => {
    const { result } = renderHook(() => useAuthLoading())
    expect(result.current).toBe(true)
  })

  it('should return false when loaded', async () => {
    vi.mocked(AuthService.getSession).mockResolvedValue(null)
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null)

    const { result } = renderHook(() => useAuthLoading())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})