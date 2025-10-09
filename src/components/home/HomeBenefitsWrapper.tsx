"use client"
import React, { useState } from 'react'
import { Benefits } from './Benefits'
import { DemoModal } from './DemoModal'

export function HomeBenefitsWrapper() {
  const [demo, setDemo] = useState<null | 'taste' | 'alerts' | 'chat'>(null)
  return (
    <>
      <Benefits onOpenDemo={setDemo} />
      <DemoModal open={!!demo} demoId={demo} onClose={() => setDemo(null)} />
    </>
  )
}


