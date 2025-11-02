import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthService, type AuthUser } from '@/lib/auth'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  refreshProfile: () => Promise<void>
}

export type UseAuthReturn = AuthState & AuthActions

/**
 * Internal hook for managing auth state (used by AuthProvider only).
 */
export function useAuthInternal(initial?: { user?: AuthUser | null; session?: Session | null; initialized?: boolean }): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: initial?.user ?? null,
    session: initial?.session ?? null,
    loading: initial ? false : true,
    initialized: initial?.initialized ?? false,
  })

  const refreshUser = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser()
      const session = await AuthService.getSession()
      setState(prev => ({ ...prev, user, session, loading: false }))
    } catch (error) {
      console.error('Error refreshing user:', error)
      setState(prev => ({ ...prev, user: null, session: null, loading: false }))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const current = await AuthService.getCurrentUser()
      setState(prev => ({ ...prev, user: current }))
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await AuthService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) { console.error('Error getting session:', error); return null }
      return session?.access_token || null
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const session = await AuthService.getSession()
        const user = session ? await AuthService.getCurrentUser() : null
        if (mounted) {
          setState({ user, session, loading: false, initialized: true })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState({ user: null, session: null, loading: false, initialized: true })
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) { return }
        setState(prev => ({ ...prev, loading: true }))
        try {
          let user: AuthUser | null = null
          if (session?.user) {
            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
              case 'USER_UPDATED':
                user = await AuthService.getCurrentUser()
                break
              case 'SIGNED_OUT':
                user = null
                break
              default:
                user = session ? await AuthService.getCurrentUser() : null
            }
          }
          if (mounted) {
            setState({ user, session, loading: false, initialized: true })
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          if (mounted) {
            setState({ user: null, session: null, loading: false, initialized: true })
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { ...state, signOut, refreshUser, getAccessToken, refreshProfile }
}

export type { AuthUser }


