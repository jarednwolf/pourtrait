"use client"
import React, { useState } from 'react'
import { Benefits } from './Benefits'
import { DemoModal } from './DemoModal'

export function HomeBenefitsWrapper() {
  // Demote interactive demos; route to learn-more pages instead of opening modals
  const [demo] = useState<null | 'taste' | 'alerts' | 'chat'>(null)
  return (
    <>
      <Benefits onOpenDemo={() => { window?.location?.assign?.('/onboarding/step1') }} />
      {demo ? <DemoModal open={false} demoId={demo} onClose={() => {}} /> : null}
    </>
  )
}


