'use client'

import React, { useEffect } from 'react'
import { AuthService } from '@/lib/auth'
// import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

type Pick = {
  title: string
  subtitle?: string
  rationale: string
}

function getDemoPicks(): { top: Pick; alternatives: Pick[] } {
  return {
    top: {
      title: "Willamette Pinot Noir 2021",
      subtitle: 'Red • Oregon, USA',
      rationale: 'Balances medium tannins and acidity you like; versatile with weeknight meals.'
    },
    alternatives: [
      {
        title: 'Sancerre 2022',
        subtitle: 'White • Loire, France',
        rationale: 'Crisp acidity and citrus profile match your freshness preference.'
      },
      {
        title: 'Prosecco NV',
        subtitle: 'Sparkling • Veneto, Italy',
        rationale: 'Light, fruit-forward bubbles for an easy aperitif.'
      }
    ]
  }
}

export default function OnboardingCompleted() {
  // const search = useSearchParams()
  const picks = getDemoPicks()

  useEffect(() => {
    track('tonights_pick_viewed')
    // Try to mark onboarding completed (best-effort)
    ;(async () => {
      try {
        const session = await AuthService.getSession()
        const user = await AuthService.getCurrentUser()
        if (session && user) {
          await AuthService.updateUserProfile(user.id, { onboardingCompleted: true })
          track('onboarding_marked_completed')
        }
      } catch {}
    })()
  }, [])

  const handleSave = () => {
    // Client-only: pretend to save
    // eslint-disable-next-line no-console
    console.log('Saved to cellar (client-only)')
    track('wine_added', { source: 'onboarding_completed' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tonight’s pick</CardTitle>
            <CardDescription>Your personalized recommendation based on your quick setup.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-primary/30 bg-primary/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{picks.top.title}</div>
                    {picks.top.subtitle && (
                      <div className="text-sm text-gray-600">{picks.top.subtitle}</div>
                    )}
                  </div>
                  <Icon name="star" className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-gray-700 mt-2">{picks.top.rationale}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {picks.alternatives.map((alt, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="font-medium text-gray-900">{alt.title}</div>
                    {alt.subtitle && <div className="text-sm text-gray-600">{alt.subtitle}</div>}
                    <div className="text-sm text-gray-700 mt-1">{alt.rationale}</div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={handleSave} aria-label="Save to cellar">
              <Icon name="save" className="w-4 h-4 mr-2" />
              Save to cellar
            </Button>
            <Button asChild variant="outline">
              <a href={`/chat?q=${encodeURIComponent(`What should I drink tonight? ${picks.top.title}`)}&send=1`} aria-label="Ask the Sommelier">
                <Icon name="sparkles" className="w-4 h-4 mr-2" />
                Ask the Sommelier
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/inventory" aria-label="Explore recommendations">
                Explore recommendations
              </a>
            </Button>
            <Button asChild variant="secondary" className="ml-auto">
              <a href="/import" aria-label="Import helper">
                Import helper
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// Metadata must not be exported in client components. Title is set via layout.


