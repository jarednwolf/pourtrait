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
    { label: 'New varietals', q: 'Suggest 3 varietals I should try next and why' },
    { label: 'Regions to explore', q: 'Which regions match my palate, with 2 producers to try per region?' },
    { label: 'Styles I may like', q: 'Based on my preferences, what wine styles should I explore next and why?' }
  ]
  return (
    <Card className="h-full" ref={ref} role="region" aria-labelledby="exploration-heading">
      <CardHeader className="p-5">
        <CardTitle id="exploration-heading" className="flex items-center text-heading-3">
          <Icon name="search" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Exploration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
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


