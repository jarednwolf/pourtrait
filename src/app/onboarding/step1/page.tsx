'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { track } from '@/lib/utils/track'

export default function OnboardingStep1() {
  const router = useRouter()
  const [acidity, setAcidity] = useState(5)
  const [tannins, setTannins] = useState(5)
  const [sweetness, setSweetness] = useState(3)
  const [oak, setOak] = useState(4)
  const [errors, setErrors] = useState<string | null>(null)

  useEffect(() => {
    track('onboarding_started')
  }, [])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors(null)
    try {
      track('taste_profile_submitted', { acidity, tannins, sweetness, oak })
      const params = new URLSearchParams({
        acidity: String(acidity),
        tannins: String(tannins),
        sweetness: String(sweetness),
        oak: String(oak)
      })
      router.push(`/onboarding/step2?${params.toString()}`)
    } catch (err: any) {
      setErrors('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Taste preferences</CardTitle>
            <CardDescription>Quick sliders to set your baseline. Accessible and keyboard-friendly.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {errors}
              </div>
            )}
            <form onSubmit={handleNext} className="space-y-6">
              <div>
                <label htmlFor="acidity" className="block text-sm font-medium text-gray-700 mb-1">Acidity</label>
                <input
                  id="acidity"
                  type="range"
                  min={1}
                  max={10}
                  value={acidity}
                  onChange={(e) => setAcidity(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Acidity"
                />
                <div className="text-sm text-gray-600 mt-1" aria-live="polite">{acidity}/10</div>
              </div>
              <div>
                <label htmlFor="tannins" className="block text-sm font-medium text-gray-700 mb-1">Tannins</label>
                <input
                  id="tannins"
                  type="range"
                  min={1}
                  max={10}
                  value={tannins}
                  onChange={(e) => setTannins(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Tannins"
                />
                <div className="text-sm text-gray-600 mt-1" aria-live="polite">{tannins}/10</div>
              </div>
              <div>
                <label htmlFor="sweetness" className="block text-sm font-medium text-gray-700 mb-1">Sweetness</label>
                <input
                  id="sweetness"
                  type="range"
                  min={1}
                  max={10}
                  value={sweetness}
                  onChange={(e) => setSweetness(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Sweetness"
                />
                <div className="text-sm text-gray-600 mt-1" aria-live="polite">{sweetness}/10</div>
              </div>
              <div>
                <label htmlFor="oak" className="block text-sm font-medium text-gray-700 mb-1">Oak</label>
                <input
                  id="oak"
                  type="range"
                  min={1}
                  max={10}
                  value={oak}
                  onChange={(e) => setOak(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Oak"
                />
                <div className="text-sm text-gray-600 mt-1" aria-live="polite">{oak}/10</div>
              </div>

              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>Skip</Button>
                <Button type="submit" aria-label="Continue to goal selection">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Onboarding Step 1 - Pourtrait'
}


