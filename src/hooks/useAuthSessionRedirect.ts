'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/utils/track'

/**
 * Subscribes to Supabase auth changes and, on SIGNED_IN, routes the user to
 * returnTo || next || /dashboard. Intended for auth screens and flows.
 */
export function useAuthSessionRedirect() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN') { return }
      try {
        const params = new URLSearchParams(window.location.search)
        const fromStorage = typeof window !== 'undefined' ? (sessionStorage.getItem('returnTo') || '') : ''
        const rt = params.get('returnTo') || params.get('next') || fromStorage || '/dashboard'
        const dest = typeof rt === 'string' && rt.startsWith('/') ? rt : '/dashboard'
        try { sessionStorage.removeItem('returnTo') } catch {}
        track('auth_to_dashboard')
        router.replace(dest)
      } catch {
        router.replace('/dashboard')
      }
    })

    return () => { subscription.unsubscribe() }
  }, [router])
}


