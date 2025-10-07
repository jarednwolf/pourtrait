"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

type Budget = '$' | '$$' | '$$$' | '$$$$'
type Vibe = 'cozy' | 'celebratory' | 'adventurous' | 'classic'

export interface ChatSidebarProps {
  onContextChange?: (ctx: { budget?: Budget; meal?: string; vibe?: Vibe; useInventory?: boolean }) => void
}

export function ChatSidebar({ onContextChange }: ChatSidebarProps) {
  const [budget, setBudget] = useState<Budget | undefined>()
  const [meal, setMeal] = useState('')
  const [vibe, setVibe] = useState<Vibe | undefined>()
  const [useInventory, setUseInventory] = useState(false)

  const update = (next: Partial<{ budget: Budget; meal: string; vibe: Vibe; useInventory: boolean }>) => {
    const ctx = { budget, meal, vibe, useInventory, ...next }
    onContextChange?.(ctx)
    track('chat_context_changed', ctx as any)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="filter" className="w-5 h-5 mr-2 text-primary" />
          Context
        </h3>
        <div className="space-y-4 text-sm">
          {/* Budget */}
          <div>
            <div className="mb-2 text-gray-700">Budget</div>
            <div className="grid grid-cols-4 gap-2">
              {(['$', '$$', '$$$', '$$$$'] as Budget[]).map((b) => (
                <Button
                  key={b}
                  variant={budget === b ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setBudget(b); update({ budget: b }) }}
                >
                  {b}
                </Button>
              ))}
            </div>
          </div>

          {/* Meal */}
          <div>
            <label htmlFor="chat-meal" className="block mb-2 text-gray-700">Meal</label>
            <input
              id="chat-meal"
              value={meal}
              onChange={(e) => { setMeal(e.target.value); }}
              onBlur={() => update({ meal })}
              placeholder="e.g., grilled salmon"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Vibe */}
          <div>
            <div className="mb-2 text-gray-700">Vibe</div>
            <div className="grid grid-cols-2 gap-2">
              {(['cozy', 'celebratory', 'adventurous', 'classic'] as Vibe[]).map((v) => (
                <Button
                  key={v}
                  variant={vibe === v ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setVibe(v); update({ vibe: v }) }}
                  className="capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Inventory Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center">
              <Icon name="save" className="w-4 h-4 text-primary mr-2" />
              <span>Use my inventory</span>
            </div>
            <button
              role="switch"
              aria-checked={useInventory}
              onClick={() => { const next = !useInventory; setUseInventory(next); update({ useInventory: next }) }}
              className={`w-10 h-6 rounded-full relative transition-colors ${useInventory ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${useInventory ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="lightbulb" className="w-5 h-5 mr-2 text-primary" />
          Tips
        </h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
          <li>Mention dish, budget, or vibe for better picks.</li>
          <li>Toggle inventory to use bottles you already have.</li>
          <li>Ask follow-ups like “why?” or “alternatives?”</li>
        </ul>
      </Card>
    </div>
  )
}


