"use client"
import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useImpression } from '@/hooks/useImpression'
import { track } from '@/lib/utils/track'

export function SommelierPreview() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'SommelierPreview' }), [])
  const ref = useImpression({ onImpress })
  return (
    <Card className="h-full" ref={ref} role="region" aria-labelledby="sommelier-heading">
      <CardHeader className="p-5">
        <CardTitle id="sommelier-heading" className="flex items-center text-heading-3">
          <Icon name="chat-bubble-left" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Sommelier Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">Ask pairing or purchase advice—any time.</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="min-w-[128px]" onClick={() => track('sommelier_chip_click', { q: 'Weeknight reds' })}>
            <a href={`/chat?q=${encodeURIComponent('Recommend weeknight-friendly reds with medium tannins')}&send=1`} aria-label="Ask for weeknight reds">Weeknight reds</a>
          </Button>
          <Button asChild size="sm" variant="outline" className="min-w-[128px]" onClick={() => track('sommelier_chip_click', { q: 'Pairs with salmon' })}>
            <a href={`/chat?q=${encodeURIComponent('What pairs with salmon?')}&send=1`} aria-label="Ask what pairs with salmon">Pairs with salmon</a>
          </Button>
          <Button asChild size="sm" variant="outline" className="min-w-[128px]" onClick={() => track('sommelier_chip_click', { q: 'Under $25' })}>
            <a href={`/chat?q=${encodeURIComponent('Find great wines under $25 that match my taste')}&send=1`} aria-label="Ask for wines under $25">Under $25</a>
          </Button>
        </div>
        <div className="mt-3">
          <Button asChild size="sm" className="min-w-[128px]"><a href="/chat?q=I%27m%20cooking%20salmon%20tonight%20%E2%80%94%20what%20pairs%20well%3F&send=1" aria-label="Ask a question">Ask a question</a></Button>
        </div>
      </CardContent>
    </Card>
  )
}


