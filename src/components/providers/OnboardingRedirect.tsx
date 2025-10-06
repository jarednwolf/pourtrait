'use client'

import { useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import { needsOnboarding } from '@/lib/auth'

export function OnboardingRedirect() {
  const { user, initialized, loading } = useAuthContext()

  useEffect(() => {
    if (!initialized || loading) {return}
    if (!user) {return}
    if (needsOnboarding(user)) {
      try {
        const path = typeof window !== 'undefined' ? window.location.pathname : ''
        // Avoid redirect loop when already on onboarding pages
        if (!path.startsWith('/onboarding')) {
          window.location.href = '/onboarding/step1'
        }
      } catch {}
    }
  }, [user, initialized, loading])

  return null
}



