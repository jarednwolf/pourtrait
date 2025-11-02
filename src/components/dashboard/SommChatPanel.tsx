"use client"

import React, { useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useImpression } from '@/hooks/useImpression'
import { track } from '@/lib/utils/track'

export function SommChatPanel() {
  const onImpress = useCallback(() => track('panel_impression', { panel: 'SommChat' }), [])
  const ref = useImpression({ onImpress })

  const chips = [
    { label: "Tonight's pick", q: 'What should I drink tonight?' },
    { label: 'Pairs with salmon', q: "I'm cooking salmon tonight — what pairs well?" },
    { label: 'Under $25', q: 'Find great wines under $25 that match my taste' },
    { label: 'Weeknight reds', q: 'Recommend weeknight-friendly reds with medium tannins' }
  ]

  return (
    <Card className="h-full" ref={ref as any} role="region" aria-labelledby="sommelier-heading">
      <CardHeader className="p-5">
        <CardTitle id="sommelier-heading" className="flex items-center text-heading-3">
          <Icon name="chat-bubble-left" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Sommelier Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-sm text-gray-700">Ask pairing or purchase advice — any time.</div>
        <div className="mt-3">
          <Button asChild size="sm" onClick={() => track('somm_chat_primary_clicked')}>
            <a href="/chat" aria-label="Ask a question">Ask a question</a>
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <Button
              key={i}
              asChild
              size="sm"
              variant="outline"
              onClick={() => track('somm_chat_chip_clicked', { label: c.label })}
            >
              <a href={`/chat?q=${encodeURIComponent(c.q)}&send=1`} aria-label={c.label}>{c.label}</a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


