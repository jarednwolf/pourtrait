import { supabase } from './supabase'
import type { User, AuthError } from '@supabase/supabase-js'
import type { UserProfile } from './supabase'
import { calculateStructuredUserProfile } from '@/lib/onboarding/quiz-calculator'
import type { QuizResponse } from '@/lib/onboarding/quiz-data'

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
  // Normalize potentially pasted emails: trim, lowercase, remove zero‑width/invisible spaces
  private static normalizeEmail(rawEmail: string): string {
    return (rawEmail || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .toLowerCase()
  }
  /**
   * Sign up a new user with email and password
   */
  static async signUp(data: SignUpData) {
    try {
      const emailRedirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=%2Fdashboard`
        : undefined

      const normalizedEmail = this.normalizeEmail(data.email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            name: data.name,
            experience_level: data.experienceLevel,
          },
          emailRedirectTo,
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
   * Upsert taste profile from pre-auth quiz responses
   * rawResponses: JSON stringified QuizResponse[] stored in localStorage
   */
  static async upsertTasteProfileFromQuiz(userId: string, rawResponses: string) {
    try {
      const parsed = JSON.parse(rawResponses)
      if (!Array.isArray(parsed)) { return }
      const responses: QuizResponse[] = parsed.map((r: any) => ({
        questionId: r.questionId,
        value: r.value,
        timestamp: new Date(r.timestamp || Date.now())
      }))

      // Compute the structured user profile used by palate_profiles schema
      const structured = calculateStructuredUserProfile(userId, responses)

      // Use the authenticated API route to persist to palate_profiles and related tables
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { return }
      await fetch('/api/profile/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(structured)
      })
    } catch (error) {
      console.error('Upsert taste profile from quiz error:', error)
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData) {
    try {
      const normalizedEmail = this.normalizeEmail(data.email)
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
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
  static async signInWithProvider(provider: 'google' | 'github' | 'apple', nextPath?: string) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const urlParams = new URLSearchParams(search)
      const candidate = nextPath || urlParams.get('returnTo') || urlParams.get('next') || '/dashboard'
      const next = typeof candidate === 'string' && candidate.startsWith('/') ? candidate : '/dashboard'
      const redirectTo = origin ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
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
      const normalizedEmail = this.normalizeEmail(data.email)
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
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
      const emailRedirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=%2Fdashboard`
        : undefined
      const normalizedEmail = this.normalizeEmail(email)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo }
      } as any)

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
      let profile = await this.getUserProfile(user.id)
      // If no profile exists yet, create a minimal one
      if (!profile) {
        try {
          await this.createUserProfile(user.id, {
            name: (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'User',
            experienceLevel: 'beginner',
          })
          profile = await this.getUserProfile(user.id)
        } catch {}
      }
      
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
        .maybeSingle()

      if (error) {
        // For safety, treat not found as null without surfacing 406s
        if ((error as any).code === 'PGRST116' || (error as any).status === 406) {
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
    const msg = String(error.message || '')
    // Friendlier copy for common, opaque GoTrue responses
    if (msg.includes('Email address') && msg.includes('is invalid')) {
      return 'That email looks invalid or uses a blocked test/disposable domain. Please enter a real email (Gmail, Outlook, iCloud, etc.). Tip: use an alias like name+demo@gmail.com to create a test account.'
    }
    if (msg.includes('is not allowed')) {
      return 'This email domain is restricted on this project. Please use a personal or work email address.'
    }
    switch (msg) {
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
        return msg
    }
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if user needs to complete onboarding
 */
export const needsOnboarding = (user: AuthUser | null): boolean => {
  // If there's no profile, or onboarding_completed is false, user needs onboarding
  if (!user || !user.profile) { return true }
  return user.profile.onboarding_completed === false
}

/**
 * Check if user has completed email verification
 */
export const isEmailVerified = (user: User | null): boolean => {
  return user?.email_confirmed_at !== null
}