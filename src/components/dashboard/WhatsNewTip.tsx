"use client"
import React from 'react'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

const STORAGE_KEY = 'pourtrait_tip_dismissed_at_v1'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

const TIPS: { id: string; text: string; href?: string; label?: string }[] = [
  { id: 'cellar-tonight', text: 'Try “From my cellar tonight” for an instant pick.', href: '/chat?q=' + encodeURIComponent('What should I open from my cellar tonight? Consider readiness and my taste.') + '&send=1', label: 'Ask now' },
  { id: 'recalibrate', text: 'Recalibrate your palate to sharpen recommendations.', href: '/onboarding/step1', label: 'Recalibrate' },
  { id: 'import', text: 'Import a CSV to load your cellar in minutes.', href: '/import', label: 'Import CSV' }
]

export function WhatsNewTip() {
  const [visible, setVisible] = React.useState(false)
  const [tip] = React.useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const ts = raw ? parseInt(raw, 10) : 0
      if (!ts || Date.now() - ts > DISMISS_MS) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
    track('tip_dismissed', { id: tip.id })
    setVisible(false)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-700">
        <Icon name="light-bulb" className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{tip.text}</span>
      </div>
      <div className="flex items-center gap-2">
        {tip.href && (
          <a href={tip.href} onClick={() => track('tip_action_click', { id: tip.id })} className="text-primary whitespace-nowrap">{tip.label || 'Learn more'}</a>
        )}
        <button onClick={dismiss} className="text-gray-500 hover:text-gray-700" aria-label="Dismiss tip">Dismiss</button>
      </div>
    </div>
  )
}


