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
    <Button asChild variant="outline" onClick={handleClick}>
      <a href="/onboarding/step1" aria-label="Start your taste profile and see tonight’s pick">Start your taste profile</a>
    </Button>
  )
}



