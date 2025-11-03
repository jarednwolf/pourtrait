"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/components/providers/AuthProvider'

export function HeaderCta() {
  const { user, loading, initialized } = useAuthContext()
  // Avoid a confusing flicker on client transitions by showing "Account" while auth is initializing
  const isReady = initialized && !loading
  const isAuthed = !!user
  const label = isReady ? (isAuthed ? 'Account' : 'Sign in') : 'Account'
  const href = isReady ? (isAuthed ? '/settings' : '/auth/signin') : '/settings'

  return (
    <Button asChild size="sm" variant="outline">
      <a href="/auth/signin" aria-label="Sign in">Sign in</a>
    </Button>
  )
}


