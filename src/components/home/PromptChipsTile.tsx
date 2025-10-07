"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

interface PromptChipsTileProps {
  className?: string
}

const PROMPTS = [
  "I'm cooking steak tonight",
  'I like Pinot Noir',
  'Recommend a wine under $25',
  'What pairs with spicy Thai curry?',
]

export function PromptChipsTile({ className = '' }: PromptChipsTileProps) {
  return (
    <Card className={className}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-base">
          <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          One‑Tap Sommelier Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p, idx) => (
            <Button
              key={idx}
              asChild
              variant="outline"
              size="sm"
              className="whitespace-normal h-auto py-2"
              onClick={() => track('prompt_chip_click', { index: idx, prompt: p })}
            >
              <a href={`/chat?q=${encodeURIComponent(p)}`} aria-label={p}>
                {p}
              </a>
            </Button>
          ))}
        </div>
        <div className="mt-3">
          <Button asChild size="sm">
            <a href="/chat" aria-label="Open Ask the Sommelier">
              Ask the Sommelier
              <Icon name="arrow-right" className="w-4 h-4 ml-2" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


