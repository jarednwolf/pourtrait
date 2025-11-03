"use client"
import React from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { needsOnboarding } from '@/lib/auth'
import { BrandLogo } from '@/components/layout/BrandLogo'

export function BrandHomeLink() {
  const { user, loading, initialized } = useAuthContext()
  const pending = !initialized || loading
  const href = pending
    ? '/settings'
    : (user ? (needsOnboarding(user) ? '/settings' : '/dashboard') : '/')
  return (
    <a href={href} className="flex items-center" aria-label="Pourtrait home">
      <BrandLogo className="h-8 sm:h-9" />
    </a>
  )
}


