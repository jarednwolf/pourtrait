"use client"

import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useImpression } from '@/hooks/useImpression'
import { track } from '@/lib/utils/track'
import { useAuth } from '@/hooks/useAuth'
import { WineService } from '@/lib/services/wine-service'
import { EnhancedWineService } from '@/lib/services/wine-service-enhanced'

export function MyCellarPanel() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'MyCellar' }), [])
  const ref = useImpression({ onImpress })
  const { user } = useAuth()
  const [stats, setStats] = React.useState<{ totalBottles: number; readyNow: number }>({ totalBottles: 0, readyNow: 0 })
  const [alertsLabel, setAlertsLabel] = React.useState<string>('')

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        if (!user) { return }
        const inv = await WineService.getInventoryStats(user.id).catch(() => ({ totalBottles: 0 }))
        const { enteringPeak = [], leavingPeak = [], overHill = [] } = await EnhancedWineService.getWinesNeedingAlerts(user.id).catch(() => ({ enteringPeak: [], leavingPeak: [], overHill: [] }))
        const readyNow = 0 // Placeholder until a ready count endpoint exists
        if (!cancelled) {
          setStats({ totalBottles: (inv as any).totalBottles || 0, readyNow })
          const parts = [] as string[]
          if (enteringPeak.length > 0) parts.push(`${enteringPeak.length} soon`)
          if (leavingPeak.length > 0) parts.push(`${leavingPeak.length} drink soon`)
          if (overHill.length > 0) parts.push(`${overHill.length} past prime`)
          setAlertsLabel(parts.join(' • '))
        }
      } catch {}
    }
    run()
    return () => { cancelled = true }
  }, [user])

  return (
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="cellar-heading">
      <CardHeader className="p-5">
        <CardTitle id="cellar-heading" className="flex items-center text-heading-3">
          <Icon name="grid" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          My Cellar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">{stats.totalBottles} bottles • {stats.readyNow} ready to drink{alertsLabel ? ` • ${alertsLabel}` : ''}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" onClick={() => track('cellar_view_inventory_clicked')}>
            <a href="/inventory" aria-label="View inventory">View inventory</a>
          </Button>
          <Button asChild size="sm" variant="outline" onClick={() => track('cellar_add_bottle_clicked')}>
            <a href="/inventory?action=add" aria-label="Add bottle">Add bottle</a>
          </Button>
          <Button asChild size="sm" variant="outline" onClick={() => track('cellar_import_csv_clicked')}>
            <a href="/import" aria-label="Import CSV">Import CSV</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


