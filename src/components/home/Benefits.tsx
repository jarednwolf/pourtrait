"use client"
import React from 'react'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

interface BenefitItem {
  icon: Parameters<typeof Icon>[0]['name']
  title: string
  desc: string
  demoId: 'taste' | 'alerts' | 'chat'
}

const BENEFITS: BenefitItem[] = [
  { icon: 'sparkles', title: 'Taste Profile', desc: 'Teach Pourtrait what you like with quick sliders.', demoId: 'taste' },
  { icon: 'clock', title: 'Drink‑Window Alerts', desc: 'Know when bottles are at their peak—never miss the moment.', demoId: 'alerts' },
  { icon: 'chat-bubble-left', title: 'AI Sommelier Chat', desc: 'Ask anything—from pairings to purchases—with rationale.', demoId: 'chat' }
]

export function Benefits({ onOpenDemo }: { onOpenDemo: (demoId: BenefitItem['demoId']) => void }) {
  return (
    <section aria-labelledby="benefits-heading" className="py-10">
      <h2 id="benefits-heading" className="text-heading-2 text-gray-900 text-center">Why Pourtrait</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BENEFITS.map((b) => (
          <Card key={b.demoId} className="p-5">
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 rounded-md bg-primary/10 p-2"><Icon name={b.icon} className="w-5 h-5 text-primary" aria-hidden="true" /></div>
              <div>
                <div className="font-medium text-gray-900">{b.title}</div>
                <p className="text-sm text-gray-600 mt-1">{b.desc}</p>
                <button
                  className="mt-3 inline-flex text-primary underline underline-offset-4"
                  onClick={() => { track('home_benefit_demo_open', { demo: b.demoId }); onOpenDemo(b.demoId) }}
                  aria-label={`Learn more about ${b.title}`}
                >
                  Learn more
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}


