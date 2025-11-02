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
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="sommelier-heading">
      <CardHeader className="p-5">
        <CardTitle id="sommelier-heading" className="flex items-center text-heading-3">
          <Icon name="chat-bubble-left" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Sommelier Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">Ask what pairs with tonight’s dinner.</div>
        <div className="mt-3">
          <Button asChild size="sm"><a href="/chat?q=I%27m%20cooking%20salmon%20tonight%20%E2%80%94%20what%20pairs%20well%3F&send=1">Ask a question</a></Button>
        </div>
      </CardContent>
    </Card>
  )
}


