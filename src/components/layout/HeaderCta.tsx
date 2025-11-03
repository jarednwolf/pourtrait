"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { AccountMenu } from '@/components/layout/AccountMenu'

export function HeaderCta() {
  const { user } = useAuth()
  if (user) {
    return <AccountMenu />
  }
  return (
    <Button asChild size="sm" variant="outline">
      <a href="/auth/signin" aria-label="Sign in">Sign in</a>
    </Button>
  )
}


