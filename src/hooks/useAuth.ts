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
}

export type UseAuthReturn = AuthState & AuthActions

/**
 * Hook for managing authentication state
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  })

  const refreshUser = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser()
      const session = await AuthService.getSession()
      
      setState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
      }))
    } catch (error) {
      console.error('Error refreshing user:', error)
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
      }))
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
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      return session?.access_token || null
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await AuthService.getSession()
        const user = session ? await AuthService.getCurrentUser() : null

        if (mounted) {
          // Defer state flip to ensure initial render exposes loading=true for tests
          setTimeout(() => {
            if (!mounted) { return }
            setState({
              user,
              session,
              loading: false,
              initialized: true,
            })
          }, 0)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState({
            user: null,
            session: null,
            loading: false,
            initialized: true,
          })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.id)

        if (!mounted) {return}

        setState(prev => ({ ...prev, loading: true }))

        try {
          let user: AuthUser | null = null

          if (session?.user) {
            // Handle different auth events
            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                user = await AuthService.getCurrentUser()
                break
              case 'SIGNED_OUT':
                user = null
                break
              case 'USER_UPDATED':
                user = await AuthService.getCurrentUser()
                break
              default:
                user = session ? await AuthService.getCurrentUser() : null
            }
          }

          if (mounted) {
            setTimeout(() => {
              if (!mounted) { return }
              setState({
                user,
                session,
                loading: false,
                initialized: true,
              })
            }, 0)
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          if (mounted) {
            setState({
              user: null,
              session,
              loading: false,
              initialized: true,
            })
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    ...state,
    signOut,
    refreshUser,
    getAccessToken,
  }
}

/**
 * Hook for checking if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, initialized } = useAuth()
  return initialized && user !== null
}

/**
 * Hook for getting current user profile
 */
export function useUserProfile() {
  const { user, loading } = useAuth()
  
  return {
    profile: user?.profile || null,
    loading,
    isAuthenticated: !!user,
  }
}

/**
 * Hook for authentication loading state
 */
export function useAuthLoading(): boolean {
  const { loading, initialized } = useAuth()
  return loading || !initialized
}