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
  const [progress, setProgress] = React.useState<number>(0)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) {
          setHasProfile(false)
          return
        }
        const res = await fetch('/api/profile/summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json().catch(() => ({}))
        if (!cancelled) {
          setHasProfile(Boolean(json?.data?.profile))
        }
      } catch {
        if (!cancelled) {
          setHasProfile(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [getAccessToken])

  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const raw = window.localStorage.getItem('pourtrait_quiz_responses_v1')
      if (!raw) { setProgress(0); return }
      const arr = JSON.parse(raw)
      const answered = Array.isArray(arr) ? arr.length : 0
      const approxTotal = 10
      const pct = Math.max(0, Math.min(100, Math.round((answered / approxTotal) * 100)))
      setProgress(pct)
    } catch { setProgress(0) }
  }, [])

  const onImpress = React.useCallback(() => track('panel_impression', { panel: 'TasteProfile' }), [])
  const ref = useImpression({ onImpress })
  const isComplete = hasProfile || progress >= 100

  return (
    <Card className="h-full" ref={ref} role="region" aria-labelledby="taste-profile-heading">
      <CardHeader className="p-5">
        <CardTitle id="taste-profile-heading" className="flex items-center text-heading-3">
          <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Taste Profile
          {isComplete && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Calibrated</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <div className="text-sm text-gray-700">Loading…</div>
        ) : isComplete ? (
          <>
            <div className="text-sm text-gray-700">See your palate balance and style levers.</div>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" className="min-w-[128px]"><a href="/profile" aria-label="See insights">View insights</a></Button>
              <Button asChild size="sm" variant="outline" className="min-w-[128px]"><a href="/onboarding/step1" aria-label="Recalibrate profile">Recalibrate</a></Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-700">Build your palate profile in minutes. {progress > 0 ? `(${progress}% saved)` : '≈ 1 min'}</div>
            {progress > 0 && (
              <div className="mt-2 h-2 w-full rounded bg-gray-100">
                <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} aria-hidden="true" />
              </div>
            )}
            <div className="mt-3">
              <Button asChild size="sm" className="min-w-[128px]"><a href="/onboarding/step1" aria-label={progress > 0 ? 'Resume profile' : 'Start profile'}>{progress > 0 ? 'Resume profile' : 'Start profile'}</a></Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


