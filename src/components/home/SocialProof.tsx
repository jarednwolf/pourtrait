import React from 'react'
import { Icon } from '@/components/ui/Icon'

export function SocialProof() {
  return (
    <section aria-label="Social proof" className="py-8">
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center">
          <Icon name="award" className="w-5 h-5 text-purple-600 mr-2" aria-hidden="true" />
          Trusted recommendations, privacy-first
        </div>
        <div className="flex items-center">
          <Icon name="users" className="w-5 h-5 text-purple-600 mr-2" aria-hidden="true" />
          Loved by home cooks and wine geeks
        </div>
        <div className="flex items-center">
          <Icon name="shield-check" className="w-5 h-5 text-purple-600 mr-2" aria-hidden="true" />
          Your data stays yours
        </div>
      </div>
    </section>
  )
}


