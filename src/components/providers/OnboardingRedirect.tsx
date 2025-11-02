'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from './AuthProvider'
import { needsOnboarding } from '@/lib/auth'

export function OnboardingRedirect() {
  const { user, initialized, loading } = useAuthContext()
  const router = useRouter()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!initialized || loading) { return }
    if (!user) { return }
    if (redirectedRef.current) { return }
    if (needsOnboarding(user)) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (!path.startsWith('/onboarding')) {
        redirectedRef.current = true
        router.push('/onboarding/step1')
      }
    }
  }, [user, initialized, loading])

  return null
}



