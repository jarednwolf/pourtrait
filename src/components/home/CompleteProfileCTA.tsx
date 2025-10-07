'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/utils/track'

interface CompleteProfileCTAProps {
  source?: string
}

export function CompleteProfileCTA({ source = 'home' }: CompleteProfileCTAProps) {
  const handleClick = () => {
    track('complete_profile_cta_clicked', { source })
  }

  return (
    <Button asChild onClick={handleClick}>
      <a href="/onboarding/step1" aria-label="Complete your profile">Complete your profile</a>
    </Button>
  )
}



