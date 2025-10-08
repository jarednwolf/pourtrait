"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'
import { AuthGate } from '@/components/auth/AuthGate'

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
    <Card className={[className, 'h-full flex flex-col'].filter(Boolean).join(' ')}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-base">
          <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          One‑Tap Sommelier Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p, idx) => (
              <AuthGate key={idx} action={{ type: 'chat', params: { q: p } }}>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="whitespace-normal h-auto py-2 leading-snug"
                  onClick={() => track('prompt_chip_click', { index: idx, prompt: p })}
                >
                  <a href="/auth/signup" aria-label={p}>
                    {p}
                  </a>
                </Button>
              </AuthGate>
            ))}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <AuthGate action={{ type: 'chat', params: { q: 'What should I drink tonight?' } }}>
            <Button asChild size="sm" className="w-full">
              <a href="/auth/signup" aria-label="Create your free account">
                Create your free account
                <Icon name="arrow-right" className="w-4 h-4 ml-2" aria-hidden="true" />
              </a>
            </Button>
          </AuthGate>
        </div>
      </CardContent>
    </Card>
  )
}


