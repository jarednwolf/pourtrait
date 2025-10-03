import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute, PublicOnlyRoute } from '../ProtectedRoute'
import { useAuthContext } from '@/components/providers/AuthProvider'

// Mock the auth context
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: vi.fn(),
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/dashboard',
  },
  writable: true,
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state when not initialized', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loading spinner
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to sign in when not authenticated', async () => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('should redirect to onboarding when user needs onboarding', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: false,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding')
    })
  })

  it('should render content when authenticated and onboarded', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: true,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should allow access to onboarding route even without onboarding completed', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: false,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    // Mock current path as onboarding
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/onboarding',
      },
      writable: true,
    })

    render(
      <ProtectedRoute>
        <div>Onboarding Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Onboarding Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should redirect to custom path when specified', async () => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute redirectTo="/custom-signin">
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-signin')
    })
  })

  it('should require onboarding when specified', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: true,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <ProtectedRoute requireOnboarding={true}>
        <div>Onboarding Required Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Onboarding Required Content')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render content when not authenticated', () => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <PublicOnlyRoute>
        <div>Public Content</div>
      </PublicOnlyRoute>
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
  })

  it('should redirect to dashboard when authenticated and onboarded', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: true,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <PublicOnlyRoute>
        <div>Public Content</div>
      </PublicOnlyRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should redirect to onboarding when authenticated but not onboarded', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: false,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <PublicOnlyRoute>
        <div>Public Content</div>
      </PublicOnlyRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding')
    })
  })

  it('should redirect to custom path when specified', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: {
        id: 'user-123',
        name: 'Test User',
        experience_level: 'beginner',
        onboarding_completed: true,
      },
    }

    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      session: { access_token: 'token' } as any,
      loading: false,
      initialized: true,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <PublicOnlyRoute redirectTo="/custom-dashboard">
        <div>Public Content</div>
      </PublicOnlyRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-dashboard')
    })
  })
})