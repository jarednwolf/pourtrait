"use client"
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/hooks/useAuth'
import { useImpression } from '@/hooks/useImpression'
import { track } from '@/lib/utils/track'

export function TasteProfilePanel() {
  const { getAccessToken } = useAuth()
  const [hasProfile, setHasProfile] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) { setHasProfile(false); return }
        const res = await fetch('/api/profile/summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json().catch(() => ({}))
        if (!cancelled) {
          setHasProfile(Boolean(json?.data?.profile))
        }
      } catch {
        if (!cancelled) setHasProfile(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [getAccessToken])

  const onImpress = React.useCallback(() => track('panel_impression', { panel: 'TasteProfile' }), [])
  const ref = useImpression({ onImpress })

  return (
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="taste-profile-heading">
      <CardHeader className="p-5">
        <CardTitle id="taste-profile-heading" className="flex items-center text-heading-3">
          <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Taste Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <div className="text-sm text-gray-700">Loading…</div>
        ) : hasProfile ? (
          <>
            <div className="text-sm text-gray-700">See your palate balance and style levers.</div>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm"><a href="/profile">View insights</a></Button>
              <Button asChild size="sm" variant="outline"><a href="/onboarding/step1">Recalibrate</a></Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-700">Teach Pourtrait what you like with quick sliders.</div>
            <div className="mt-3">
              <Button asChild size="sm"><a href="/onboarding/step1">Start profile</a></Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


