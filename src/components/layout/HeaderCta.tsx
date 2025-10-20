"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function HeaderCta() {
  const { user } = useAuth()
  const href = user ? '/settings' : '/auth/signin'
  const label = user ? 'Account' : 'Sign in'

  return (
    <Button asChild size="sm">
      <a href={href} aria-label={label}>{label}</a>
    </Button>
  )
}


