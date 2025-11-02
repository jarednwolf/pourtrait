'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthContext } from './AuthProvider'
import { needsOnboarding } from '@/lib/auth'

export function OnboardingRedirect() {
  const { user, initialized, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!initialized || loading) { return }
    if (!user) { return }
    if (redirectedRef.current) { return }
    if (!needsOnboarding(user)) { return }
    const current = pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
    const protectedPrefixes = ['/dashboard', '/inventory', '/chat', '/profile']
    const isProtected = protectedPrefixes.some((p) => current.startsWith(p))
    if (isProtected) {
      redirectedRef.current = true
      router.push('/onboarding/step1')
    }
  }, [user, initialized, loading, pathname])

  return null
}



