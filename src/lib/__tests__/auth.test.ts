import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthService, getAuthErrorMessage } from '../auth'
import { supabase } from '../supabase'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      resend: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', name: 'Test User' },
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        experienceLevel: 'beginner',
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.needsEmailConfirmation).toBe(false)
    })

    it('should handle email confirmation required', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      const result = await AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        experienceLevel: 'beginner',
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toBeNull()
      expect(result.needsEmailConfirmation).toBe(true)
    })

    it('should throw error on sign up failure', async () => {
      const mockError = new Error('Email already registered')
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      await expect(AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        experienceLevel: 'beginner',
      })).rejects.toThrow('Email already registered')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
    })

    it('should throw error on invalid credentials', async () => {
      const mockError = new Error('Invalid login credentials')
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      await expect(AuthService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow('Invalid login credentials')
    })
  })

  describe('signInWithProvider', () => {
    it('should initiate OAuth sign in', async () => {
      const mockData = { url: 'https://oauth-url.com' }
      
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await AuthService.signInWithProvider('google')

      expect(result).toEqual(mockData)
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      })

      await expect(AuthService.signOut()).resolves.not.toThrow()
    })

    it('should throw error on sign out failure', async () => {
      const mockError = new Error('Sign out failed')
      
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      })

      await expect(AuthService.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })

      await expect(AuthService.resetPassword({
        email: 'test@example.com',
      })).resolves.not.toThrow()

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/auth/reset-password'),
        }
      )
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      await expect(AuthService.updatePassword({
        password: 'newpassword123',
      })).resolves.not.toThrow()

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })
  })

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = { access_token: 'token', user: { id: 'user-123' } }
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await AuthService.getSession()
      expect(result).toEqual(mockSession)
    })

    it('should return null on error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      })

      const result = await AuthService.getSession()
      expect(result).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should return user with profile', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', name: 'Test User', experience_level: 'beginner' }
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await AuthService.getCurrentUser()
      
      expect(result).toEqual({
        ...mockUser,
        profile: mockProfile,
      })
    })

    it('should return null when no user', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await AuthService.getCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('createUserProfile', () => {
    it('should create user profile', async () => {
      const mockProfile = { id: 'user-123', name: 'Test User' }
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await AuthService.createUserProfile('user-123', {
        name: 'Test User',
        experienceLevel: 'beginner',
      })

      expect(result).toEqual(mockProfile)
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const mockProfile = { id: 'user-123', name: 'Updated User' }
      
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await AuthService.updateUserProfile('user-123', {
        name: 'Updated User',
      })

      expect(result).toEqual(mockProfile)
    })
  })
})

describe('getAuthErrorMessage', () => {
  it('should return user-friendly error messages', () => {
    expect(getAuthErrorMessage(new Error('Invalid login credentials')))
      .toBe('Invalid email or password. Please check your credentials and try again.')
    
    expect(getAuthErrorMessage(new Error('Email not confirmed')))
      .toBe('Please check your email and click the confirmation link before signing in.')
    
    expect(getAuthErrorMessage(new Error('User already registered')))
      .toBe('An account with this email already exists. Please sign in instead.')
    
    expect(getAuthErrorMessage(new Error('Password should be at least 6 characters')))
      .toBe('Password must be at least 6 characters long.')
    
    expect(getAuthErrorMessage(new Error('Some other error')))
      .toBe('Some other error')
  })
})