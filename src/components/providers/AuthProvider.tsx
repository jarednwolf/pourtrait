'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useAuth, type UseAuthReturn } from '@/hooks/useAuth'
import { consumePostAuthIntent, navigateForIntent } from '@/lib/auth/intent'
import { events } from '@/lib/utils/track'

const AuthContext = createContext<UseAuthReturn | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication context provider
 * Provides authentication state and actions to the entire app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  // Consume any stored post-auth intent once the user becomes authenticated
  useEffect(() => {
    if (!auth.initialized || auth.loading) {return}
    if (!auth.user) {return}
    const intent = consumePostAuthIntent()
    if (intent) {
      events.postAuthResume(intent.type)
      navigateForIntent(intent)
    }
  }, [auth.initialized, auth.loading, auth.user])

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, initialized } = useAuthContext()

    // Show loading state while checking authentication
    if (!initialized || loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    // Redirect to sign in if not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
      return null
    }

    return <Component {...props} />
  }
}