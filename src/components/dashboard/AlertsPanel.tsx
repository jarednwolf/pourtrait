"use client"
import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/utils/track'
import { useImpression } from '@/hooks/useImpression'

export function AlertsPanel() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'Alerts' }), [])
  const ref = useImpression({ onImpress })
  return (
    <Card className="h-full" ref={ref} role="region" aria-labelledby="alerts-heading">
      <CardHeader className="p-5">
        <CardTitle id="alerts-heading" className="flex items-center text-heading-3">
          <Icon name="bell" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">No alerts yet — add bottles to see drink‑window reminders.</div>
        <div className="mt-3">
          <Button asChild size="sm" className="min-w-[128px]" variant="outline"><a href="/inventory?action=add" aria-label="Add your first bottle" onClick={() => track('dashboard_alerts_add_clicked')}>Add your first bottle</a></Button>
        </div>
      </CardContent>
    </Card>
  )
}


