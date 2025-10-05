'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { needsOnboarding } from '@/lib/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requireOnboarding?: boolean
  redirectTo?: string
}

/**
 * Component for protecting routes that require authentication
 */
export function ProtectedRoute({ 
  children, 
  requireOnboarding = false,
  redirectTo = '/auth/signin'
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) {
      return
    }

    // Not authenticated - redirect to sign in
    if (!user) {
      router.push(redirectTo)
      return
    }

    // Check onboarding requirement
    if (requireOnboarding && needsOnboarding(user)) {
      router.push('/onboarding')
      return
    }

    // If user needs onboarding but route doesn't require it, redirect to onboarding
    if (!requireOnboarding && needsOnboarding(user)) {
      // Allow access to certain routes even without onboarding
      const allowedRoutes = ['/onboarding', '/auth/signout', '/profile']
      const currentPath = window.location.pathname
      
      if (!allowedRoutes.includes(currentPath)) {
        router.push('/onboarding')
        return
      }
    }
  }, [user, loading, initialized, requireOnboarding, redirectTo, router])

  // Show loading state
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  // Check onboarding requirements
  if (requireOnboarding && needsOnboarding(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Redirecting to onboarding...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Component for routes that should only be accessible to unauthenticated users
 */
export function PublicOnlyRoute({ 
  children, 
  redirectTo = '/dashboard' 
}: { 
  children: ReactNode
  redirectTo?: string 
}) {
  const { user, loading, initialized } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) {
      return
    }

    if (user) {
      // If user needs onboarding, redirect there instead
      if (needsOnboarding(user)) {
        router.push('/onboarding')
      } else {
        router.push(redirectTo)
      }
    }
  }, [user, loading, initialized, redirectTo, router])

  // Show loading state
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Already authenticated
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Already Signed In
          </h2>
          <p className="text-gray-600">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}