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
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user: raw } } = await supabase.auth.getUser()
      let profileUser: AuthUser | null = raw as any
      // Attach profile asynchronously
      if (raw) {
        AuthService.getUserProfile(raw.id).then(p => {
          setState(prev => ({ ...prev, user: p ? { ...(raw as any), profile: p } : (raw as any) }))
        }).catch(() => {})
      }
      setState(prev => ({ ...prev, user: profileUser, session: session || null, loading: false }))
    } catch (error) {
      console.error('Error refreshing user:', error)
      setState(prev => ({ ...prev, user: null, session: null, loading: false }))
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
        const { data: { session } } = await supabase.auth.getSession()
        const { data: { user: raw } } = await supabase.auth.getUser()
        if (mounted) {
          setState({ user: raw as any, session: session || null, loading: false, initialized: true })
        }
        if (raw) {
          AuthService.getUserProfile(raw.id).then(p => {
            if (mounted) {
              setState(prev => ({ ...prev, user: p ? { ...(raw as any), profile: p } : (raw as any) }))
            }
          }).catch(() => {})
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState({ user: null, session: null, loading: false, initialized: true })
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
          let nextUser: AuthUser | null = session?.user as any

          if (mounted) {
            setState({ user: nextUser, session, loading: false, initialized: true })
          }

          // Attach/refresh profile in the background
          if (session?.user) {
            try {
              const profile = await AuthService.getUserProfile(session.user.id)
              if (mounted) {
                setState(prev => ({ ...prev, user: profile ? { ...(session.user as any), profile } : (session.user as any) }))
              }
            } catch {}
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