import React from 'react'
import { Icon } from '@/components/ui/Icon'

export function TrustBadges() {
  const badges = [
    { icon: 'shield-check', title: 'Privacy-first', desc: 'You control your data' },
    { icon: 'leaf', title: 'No spam', desc: 'Thoughtful notifications only' },
    { icon: 'book-open', title: 'Transparent AI', desc: 'Sources and rationale shown' },
  ] as const

  return (
    <section aria-label="Trust and privacy badges" className="py-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {badges.map((b, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 bg-white">
            <div className="flex items-center mb-1">
              <Icon name={b.icon as any} className="w-5 h-5 text-purple-600 mr-2" aria-hidden="true" />
              <div className="font-medium text-gray-900">{b.title}</div>
            </div>
            <p className="text-sm text-gray-600">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}


