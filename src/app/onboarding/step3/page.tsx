'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { track } from '@/lib/utils/track'

type SampleWine = {
  name: string
  producer: string
  vintage: number
  region: string
  country: string
  varietal: string[]
  type: 'red' | 'white' | 'sparkling'
}

const SAMPLE_WINES: SampleWine[] = [
  { name: 'Pinot Noir', producer: 'Willamette Estates', vintage: 2021, region: 'Willamette Valley', country: 'USA', varietal: ['Pinot Noir'], type: 'red' },
  { name: 'Sancerre', producer: 'Domaine Durand', vintage: 2022, region: 'Loire', country: 'France', varietal: ['Sauvignon Blanc'], type: 'white' },
  { name: 'Prosecco', producer: 'Valdobbiadene', vintage: 2023, region: 'Veneto', country: 'Italy', varietal: ['Glera'], type: 'sparkling' },
]

export default function OnboardingStep3() {
  const router = useRouter()
  const search = useSearchParams()
  const [selected, setSelected] = React.useState<number | null>(0)
  const [quickName, setQuickName] = React.useState('')
  const [quickProducer, setQuickProducer] = React.useState('')
  const [quickType, setQuickType] = React.useState<'red' | 'white' | 'sparkling'>('red')

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault()
    track('onboarding_completed')
    const params = new URLSearchParams(search?.toString())
    if (selected !== null) {
      const w = SAMPLE_WINES[selected]
      params.set('firstWine', JSON.stringify(w))
    } else if (quickName && quickProducer) {
      params.set('firstWine', JSON.stringify({
        name: quickName,
        producer: quickProducer,
        vintage: new Date().getFullYear(),
        region: 'Unknown',
        country: 'Unknown',
        varietal: [],
        type: quickType
      }))
    }
    router.push(`/onboarding/completed?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Step 3: First wine</CardTitle>
            <CardDescription>Choose a sample or quick-add your first bottle.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinish} className="space-y-6">
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="list" aria-label="Sample wines">
                  {SAMPLE_WINES.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelected(idx)}
                      aria-pressed={selected === idx}
                      className={`border rounded-md p-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 ${selected === idx ? 'border-purple-600 ring-1 ring-purple-600' : 'border-gray-300'}`}
                    >
                      <div className="font-medium text-gray-900">{w.name}</div>
                      <div className="text-sm text-gray-600">{w.producer}</div>
                      <div className="text-xs text-gray-500">{w.region}, {w.country} • {w.vintage}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Or quick add</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="qname" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input id="qname" value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder="e.g., Chianti Classico" aria-label="Wine name" />
                  </div>
                  <div>
                    <label htmlFor="qproducer" className="block text-sm font-medium text-gray-700 mb-1">Producer</label>
                    <Input id="qproducer" value={quickProducer} onChange={(e) => setQuickProducer(e.target.value)} placeholder="e.g., Fontodi" aria-label="Producer" />
                  </div>
                  <div>
                    <label htmlFor="qtype" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select id="qtype" value={quickType} onChange={(e) => setQuickType(e.target.value as any)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label="Wine type">
                      <option value="red">Red</option>
                      <option value="white">White</option>
                      <option value="sparkling">Sparkling</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} aria-label="Back to goal">Back</Button>
                <Button type="submit" aria-label="Finish onboarding">Finish</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Onboarding Step 3 - Pourtrait'
}


