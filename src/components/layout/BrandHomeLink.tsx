"use client"
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { needsOnboarding } from '@/lib/auth'
import { BrandLogo } from '@/components/layout/BrandLogo'

export function BrandHomeLink() {
  const { user } = useAuth()
  const href = user ? (needsOnboarding(user) ? '/settings' : '/dashboard') : '/'
  return (
    <a href={href} className="flex items-center" aria-label="Pourtrait home">
      <BrandLogo className="h-8 sm:h-9" />
    </a>
  )
}


