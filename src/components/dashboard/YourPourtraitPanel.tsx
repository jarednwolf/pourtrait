"use client"

import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useImpression } from '@/hooks/useImpression'
import { track } from '@/lib/utils/track'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'

export function YourPourtraitPanel() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'YourPourtrait' }), [])
  const ref = useImpression({ onImpress })
  const { getAccessToken } = useAuth()
  const [loading, setLoading] = React.useState<boolean>(true)
  const [summary, setSummary] = React.useState<string>('')
  const [isCalibrated, setIsCalibrated] = React.useState<boolean>(false)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) { return }
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` }
        const [profileRes, summaryRes] = await Promise.all([
          fetch('/api/profile/summary', { headers }),
          fetch('/api/profile/summary', { method: 'POST', headers, body: JSON.stringify({}) })
        ])
        if (!cancelled) {
          const p = await profileRes.json().catch(() => ({}))
          const s = await summaryRes.json().catch(() => ({}))
          setSummary(s?.data?.summary || '')
          setIsCalibrated(!!p?.data?.profile)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [getAccessToken])

  return (
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="pourtrait-heading">
      <CardHeader className="p-5">
        <CardTitle id="pourtrait-heading" className="flex items-center text-heading-3">
          <Icon name="user" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Your Pourtrait
          {isCalibrated && (
            <span className="ml-2">
              <Badge variant="primary">Calibrated</Badge>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">{loading ? 'Loading…' : (summary || 'See your palate balance and style levers.')}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" onClick={() => track('pourtrait_view_insights_clicked')}>
            <a href="/profile" aria-label="View insights">View insights</a>
          </Button>
          <Button asChild size="sm" variant="outline" onClick={() => track('pourtrait_recalibrate_clicked')}>
            <a href="/onboarding/step1" aria-label="Recalibrate my palate">Recalibrate</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


