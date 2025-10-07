"use client"

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

export interface AssistantPick {
  title: string
  region?: string
  styleChips?: string[]
  imageUrl?: string
  rationale: string
  confidence?: number // 0..1
  alternatives?: Array<{ title: string; rationale?: string }>
}

export function AssistantCard({ pick }: { pick: AssistantPick }) {
  const confidencePct = pick.confidence !== undefined ? Math.round(pick.confidence * 100) : undefined

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <div className="w-20 h-28 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
          {pick.imageUrl ? (
            <div className="relative w-full h-full">
              <Image 
                src={pick.imageUrl} 
                alt="Bottle" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw" 
                className="object-cover"
                placeholder="blur"
                blurDataURL={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><filter id='b'><feGaussianBlur stdDeviation='2'/></filter><rect width='8' height='8' fill='%23e5e7eb' filter='url(%23b)'/></svg>"}
                fetchPriority="high"
                priority
              />
            </div>
          ) : (
            <Icon name="wine" className="text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm text-gray-500">Top Pick</div>
              <h4 className="text-lg font-semibold text-gray-900 truncate">{pick.title}</h4>
              {pick.region && <div className="text-sm text-gray-600">{pick.region}</div>}
              {pick.styleChips && pick.styleChips.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {pick.styleChips.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
            {confidencePct !== undefined && (
              <Badge variant="primary" className="whitespace-nowrap">{confidencePct}%</Badge>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-2">{pick.rationale}</p>

          {pick.alternatives && pick.alternatives.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-900 mb-1">Alternatives</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {pick.alternatives.slice(0, 2).map((alt, i) => (
                  <li key={i}><span className="font-medium">{alt.title}</span>{alt.rationale ? ` — ${alt.rationale}` : ''}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => track('recommendation_saved')}>Save to cellar</Button>
            <Button size="sm" variant="outline" onClick={() => track('chat_prompt_sent', { source: 'follow_up', prompt: 'Why this pick?' })}>Why this pick?</Button>
            <Button size="sm" variant="outline" onClick={() => track('chat_prompt_sent', { source: 'follow_up', prompt: 'Show two more options' })}>Two more options</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}


