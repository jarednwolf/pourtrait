"use client"
import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'
import { useImpression } from '@/hooks/useImpression'

export function ExplorationPanel() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'Exploration' }), [])
  const ref = useImpression({ onImpress })
  const chips = [
    { label: 'Explore new varietals', q: 'Suggest 3 varietals I might love and why' },
    { label: 'Under $25', q: 'Find great wines under $25 that match my taste' },
    { label: 'Weeknight reds', q: 'Recommend weeknight-friendly reds with medium tannins' }
  ]
  return (
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="exploration-heading">
      <CardHeader className="p-4">
        <CardTitle id="exploration-heading" className="flex items-center text-base">
          <Icon name="magnifying-glass" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Exploration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <Button key={i} asChild size="sm" variant="outline" onClick={() => track('exploration_chip_clicked', { label: c.label })}>
              <a href={`/chat?q=${encodeURIComponent(c.q)}&send=1`} aria-label={c.label}>{c.label}</a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


