'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { ExtractedWineListItem } from '@/types'
import { track } from '@/lib/utils/track'

interface ScannerDemoTileProps {
  className?: string
}

const SAMPLE_MENU = `By the glass
Pinot Grigio – Veneto 12
Sauvignon Blanc – Marlborough 14
Chardonnay – Sonoma Coast 15
Pinot Noir – Willamette Valley 16
Cabernet Sauvignon – Napa 18
`

function parseSampleMenu(text: string): ExtractedWineListItem[] {
  const lines = text.split('\n').filter((l) => /\w+\s+–\s+|\-/.test(l))
  const items: ExtractedWineListItem[] = []
  for (const line of lines) {
    const match = line.match(/^(.*)\s+–\s+(.*)\s+(\d+)/)
    if (match) {
      const [, name, region, price] = match
      items.push({ name: name.trim(), description: region.trim(), price: `$${price}`, confidence: 0.86 })
    }
  }
  return items.slice(0, 5)
}

export function ScannerDemoTile({ className = '' }: ScannerDemoTileProps) {
  const [showResults, setShowResults] = useState(false)
  const wines = useMemo(() => parseSampleMenu(SAMPLE_MENU), [])

  return (
    <Card className={className}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-base">
          <Icon name="camera" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Restaurant Scanner (Demo)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col">
        {!showResults ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">Paste or try a sample wine list to see top picks.</p>
            <div className="rounded-md border border-gray-200 p-3 bg-white text-sm max-h-32 overflow-auto" aria-label="Sample menu text">
              <pre className="whitespace-pre-wrap">{SAMPLE_MENU}</pre>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => { setShowResults(true); track('scanner_demo_used') }} aria-label="Process sample">Show sample results</Button>
              <Button asChild variant="outline" size="sm">
                <a href="/restaurant-scanner" onClick={() => track('scanner_opened', { source: 'home_tile' })} aria-label="Open full scanner">Open full scanner</a>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-700 mb-2">Top 3 picks</div>
            <div className="space-y-2">
              {wines.slice(0, 3).map((w, i) => (
                <div key={i} className="rounded-md border border-gray-200 p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{w.name}</div>
                      <div className="text-sm text-gray-600">{w.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-medium">{w.price || '$$'}</div>
                      <div className="text-xs text-gray-500">Confidence {Math.round(w.confidence * 100)}%</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm">Save to cellar</Button>
                    <Button variant="outline" size="sm">Share</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


