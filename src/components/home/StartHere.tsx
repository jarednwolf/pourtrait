"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

export function StartHere() {
  const items = [
    { icon: 'zap', title: "Tonight's Pick", href: '/chat?q=' + encodeURIComponent("What should I drink tonight?") + '&send=1', event: 'cta_tonights_pick_click' },
    { icon: 'clipboard-list', title: 'Pair a Dish', href: '#mini-pairing', event: 'pairing_cta_click' },
    { icon: 'save', title: 'Build My Cellar', href: '/inventory', event: 'inventory_opened' }
  ] as const

  return (
    <section aria-labelledby="start-here-heading" className="py-12">
      <h2 id="start-here-heading" className="text-heading-2 text-gray-900 text-center mb-8">Start here</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Icon name={it.icon as any} className="w-5 h-5 text-primary mr-2" aria-hidden="true" />
                {it.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={it.href}
                onClick={() => track(it.event, { source: 'start_here' })}
                className="inline-flex items-center text-primary underline underline-offset-4"
                aria-label={it.title}
              >
                Go
                <span aria-hidden className="ml-1">→</span>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}


