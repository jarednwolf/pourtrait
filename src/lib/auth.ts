import { supabase } from './supabase'
import type { User, AuthError } from '@supabase/supabase-js'
import type { UserProfile } from './supabase'

export interface AuthUser extends User {
  profile?: UserProfile
}

export interface SignUpData {
  email: string
  password: string
  name: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  password: string
}

export interface UpdateProfileData {
  name?: string
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  onboardingCompleted?: boolean
  preferences?: Record<string, any>
}

/**
 * Authentication service class for managing user authentication
 */
export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  static async signUp(data: SignUpData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            experience_level: data.experienceLevel,
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Create user profile
      if (authData.user && !authData.session) {
        // Email confirmation required
        return {
          user: authData.user,
          session: null,
          needsEmailConfirmation: true,
        }
      }

      // If user is immediately confirmed, create profile
      if (authData.user && authData.session) {
        await this.createUserProfile(authData.user.id, {
          name: data.name,
          experienceLevel: data.experienceLevel,
        })
      }

      return {
        user: authData.user,
        session: authData.session,
        needsEmailConfirmation: false,
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw error
      }

      return authData
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Sign in with OAuth provider
   */
  static async signInWithProvider(provider: 'google' | 'github' | 'apple') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('OAuth sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(data: ResetPasswordData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(data: UpdatePasswordData) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    }
  }

  /**
   * Resend email confirmation
   */
  static async resendConfirmation(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Resend confirmation error:', error)
      throw error
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Get current user with profile
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Fetch user profile
      const profile = await this.getUserProfile(user.id)
      
      return {
        ...user,
        profile: profile ?? undefined,
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Create user profile after successful authentication
   */
  static async createUserProfile(
    userId: string,
    profileData: {
      name: string
      experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          name: profileData.name,
          experience_level: profileData.experienceLevel,
          onboarding_completed: false,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Create user profile error:', error)
      throw error
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: UpdateProfileData) {
    try {
      const updateData: Partial<UserProfile> = {}

      if (updates.name !== undefined) {
        updateData.name = updates.name
      }
      if (updates.experienceLevel !== undefined) {
        updateData.experience_level = updates.experienceLevel
      }
      if (updates.onboardingCompleted !== undefined) {
        updateData.onboarding_completed = updates.onboardingCompleted
      }
      if (updates.preferences !== undefined) {
        updateData.preferences = updates.preferences
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteAccount() {
    try {
      // Note: This will cascade delete all user data due to foreign key constraints
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Delete user profile (cascades to all related data)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authError) {
        throw authError
      }
    } catch (error) {
      console.error('Delete account error:', error)
      throw error
    }
  }
}

/**
 * Auth error handling utilities
 */
export const getAuthErrorMessage = (error: AuthError | Error): string => {
  if ('message' in error) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.'
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.'
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.'
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.'
      case 'Signup is disabled':
        return 'New account registration is currently disabled.'
      default:
        return error.message
    }
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if user needs to complete onboarding
 */
export const needsOnboarding = (user: AuthUser | null): boolean => {
  return user?.profile?.onboarding_completed === false
}

/**
 * Check if user has completed email verification
 */
export const isEmailVerified = (user: User | null): boolean => {
  return user?.email_confirmed_at !== null
}