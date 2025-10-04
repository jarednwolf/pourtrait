'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

interface MiniPairingTileProps {
  className?: string
}

type MiniSuggestion = {
  title: string
  rationale: string
}

function getMiniPairing(dish: string): MiniSuggestion[] {
  const text = dish.toLowerCase()
  if (!text || text.length < 2) {return []}

  if (/(steak|beef|lamb|burger)/.test(text)) {
    return [
      { title: 'Cabernet Sauvignon', rationale: 'Tannins complement rich proteins; classic with steak.' },
      { title: 'Malbec', rationale: 'Bold fruit and structure match grilled red meats.' },
    ]
  }
  if (/(salmon|trout|tuna)/.test(text)) {
    return [
      { title: 'Pinot Noir', rationale: 'Light tannins and red fruit suit rich salmon.' },
      { title: 'Chardonnay', rationale: 'Body and texture balance oily fish.' },
    ]
  }
  if (/(chicken|turkey)/.test(text)) {
    return [
      { title: 'Chardonnay', rationale: 'Roast chicken loves medium-bodied whites.' },
      { title: 'Pinot Noir', rationale: 'Versatile red for poultry and herbs.' },
    ]
  }
  if (/(thai|curry|spicy|szechuan|sichuan|chili)/.test(text)) {
    return [
      { title: 'Riesling (off-dry)', rationale: 'Sweetness cools spice; acidity refreshes.' },
      { title: 'Gewürztraminer', rationale: 'Aromatic profile works with bold spices.' },
    ]
  }
  if (/(pasta|tomato|marinara|pizza)/.test(text)) {
    return [
      { title: 'Chianti (Sangiovese)', rationale: 'High acidity mirrors tomato sauces.' },
      { title: 'Barbera', rationale: 'Fresh acidity and red fruit for tomato-based dishes.' },
    ]
  }
  if (/(oyster|sushi|ceviche|sole|halibut|cod)/.test(text)) {
    return [
      { title: 'Sauvignon Blanc', rationale: 'Zippy acidity suits delicate seafood.' },
      { title: 'Champagne', rationale: 'Bubbles and minerality elevate briny dishes.' },
    ]
  }
  return [
    { title: 'Pinot Noir', rationale: 'Light, food-friendly red pairs broadly.' },
    { title: 'Sauvignon Blanc', rationale: 'Crisp, versatile white for many dishes.' },
  ]
}

export function MiniPairingTile({ className = '' }: MiniPairingTileProps) {
  const [dish, setDish] = useState('grilled salmon')
  const suggestions = useMemo(() => getMiniPairing(dish).slice(0, 2), [dish])

  return (
    <Card className={className}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center text-base">
          <Icon name="clipboard-list" className="w-5 h-5 mr-2 text-purple-600" aria-hidden="true" />
          Mini Pairing
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <label htmlFor="dish" className="sr-only">Describe your dish</label>
        <div className="flex gap-2">
          <Input
            id="dish"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            placeholder="e.g., grilled salmon with herbs"
            aria-label="Dish description"
          />
          <Button
            type="button"
            onClick={() => setDish(dish.trim())}
            aria-label="Get pairing"
          >
            Try
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2" aria-live="polite">
            {suggestions.map((sug, i) => (
              <div key={i} className="rounded-md border border-gray-200 p-3 bg-white">
                <div className="font-medium text-gray-900 flex items-center">
                  <Icon name="star" className="w-4 h-4 mr-2 text-yellow-500" aria-hidden="true" />
                  {sug.title}
                </div>
                <p className="text-sm text-gray-600 mt-1">{sug.rationale}</p>
              </div>
            ))}
            <div className="text-xs text-gray-500">
              Demo only. For personalized picks, ask the sommelier.
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/chat" aria-label="Ask the Sommelier">Ask the Sommelier</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


