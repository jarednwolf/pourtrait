import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'

interface ProfileSummaryProps {
  dbProfile?: any
  summary?: string
  className?: string
}

function Bar({ value = 0.5, label }: { value?: number; label: string }) {
  const pct = Math.max(0, Math.min(1, Number(value || 0))) * 100
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>{label}</span>
        <span className="tabular-nums text-gray-500">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded bg-gray-100">
        <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function ProfileSummary({ dbProfile, summary, className }: ProfileSummaryProps) {
  const dislikes: string[] = Array.isArray(dbProfile?.dislikes) ? dbProfile.dislikes : []

  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="user" className="w-5 h-5 text-primary" />
            Palate balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Bar value={dbProfile?.sweetness} label="Sweetness" />
          <Bar value={dbProfile?.acidity} label="Acidity" />
          <Bar value={dbProfile?.tannin} label="Tannin" />
          <Bar value={dbProfile?.bitterness} label="Bitterness" />
          <Bar value={dbProfile?.body} label="Body" />
          <Bar value={dbProfile?.alcohol_warmth} label="Alcohol warmth" />
          <Bar value={dbProfile?.sparkle_intensity} label="Sparkle intensity" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="scale" className="w-5 h-5 text-primary" />
            Style levers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Bar value={dbProfile?.oak} label="Oak" />
          <Bar value={dbProfile?.malolactic_butter} label="Malolactic / butter" />
          <Bar value={dbProfile?.oxidative} label="Oxidative" />
          <Bar value={dbProfile?.minerality} label="Minerality" />
          <Bar value={dbProfile?.fruit_ripeness} label="Fruit ripeness" />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="sparkles" className="w-5 h-5 text-primary" />
            Your taste in words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{summary || 'Your AI taste summary will appear here.'}</p>
          {dislikes?.length ? (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-900 mb-2">Avoids</div>
              <div className="flex flex-wrap gap-2">
                {dislikes.map((d) => (
                  <span key={d} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{d}</span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}


