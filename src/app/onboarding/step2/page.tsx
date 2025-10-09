'use client'
export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/utils/track'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

type Goal = 'learn' | 'organize' | 'pairing' | 'discover'

function Step2Content() {
  const router = useRouter()
  const search = useSearchParams()
  const [goal, setGoal] = React.useState<Goal>('discover')

  useEffect(() => { track('onboarding_step_viewed', { step: 2 }) }, [])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(search?.toString())
    params.set('goal', goal)
    track('onboarding_step_completed', { step: 2, goal })
    router.push(`/onboarding/step3?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Your goal</CardTitle>
            <CardDescription>What should Pourtrait help you achieve first?</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNext} className="space-y-6">
              <fieldset role="radiogroup" aria-labelledby="goal-legend">
                <legend id="goal-legend" className="text-sm font-medium text-gray-700 mb-1">Primary goal</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { key: 'discover', label: "Find what to drink tonight" },
                      { key: 'organize', label: 'Organize my cellar' },
                      { key: 'pairing', label: 'Pair wine with dinner' },
                      { key: 'learn', label: 'Learn about wine' }
                    ] as Array<{ key: Goal; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      role="radio"
                      aria-checked={goal === opt.key}
                      aria-labelledby={`goal-${opt.key}`}
                      onClick={() => setGoal(opt.key)}
                      className={`border rounded-md p-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 ${goal === opt.key ? 'border-purple-600 ring-1 ring-purple-600' : 'border-gray-300'}`}
                    >
                      <div id={`goal-${opt.key}`} className="font-medium text-gray-900">{opt.label}</div>
                      {goal === opt.key && (
                        <div className="text-xs text-purple-700 mt-1">Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} aria-label="Back to taste preferences">Back</Button>
                <Button type="submit" aria-label="Continue to first wine">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingStep2() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <Step2Content />
    </Suspense>
  )
}

// Metadata must not be exported in client components.


