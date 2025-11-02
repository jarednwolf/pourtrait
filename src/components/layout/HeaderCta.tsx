"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/components/providers/AuthProvider'

export function HeaderCta() {
  const { user } = useAuthContext()
  const href = user ? '/settings' : '/auth/signin'
  const label = user ? 'Account' : 'Sign in'

  return (
    <Button asChild size="sm" variant="outline">
      <a href={href} aria-label={label}>{label}</a>
    </Button>
  )
}


