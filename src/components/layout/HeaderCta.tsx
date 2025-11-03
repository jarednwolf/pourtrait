"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { AccountMenu } from '@/components/layout/AccountMenu'

export function HeaderCta() {
  const { user, loading, initialized } = useAuthContext()
  const isReady = initialized && !loading

  // While auth is initializing, show a neutral Account button (prevents flicker)
  if (!isReady) {
    return (
      <Button asChild size="sm" variant="outline">
        <a href="/settings" aria-label="Account">Account</a>
      </Button>
    )
  }

  if (user) {
    return <AccountMenu />
  }

  return (
    <Button asChild size="sm" variant="outline">
      <a href="/auth/signin" aria-label="Sign in">Sign in</a>
    </Button>
  )
}


