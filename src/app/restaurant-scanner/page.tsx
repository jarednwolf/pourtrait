'use client'

import React from 'react'
import { track } from '@/lib/utils/track'
import { RestaurantWineListScanner } from '@/components/wine/RestaurantWineListScanner'

export default function RestaurantScannerPage() {
  const isEnabled = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENABLE_SCANNER === 'true' : false
  if (!isEnabled) {
    if (typeof window !== 'undefined') {track('scanner_blocked', { reason: 'flag_disabled' })}
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Scanner coming soon</h1>
          <p className="text-gray-600 mt-2">This feature is not available yet. Check back soon.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RestaurantWineListScanner />
      </div>
    </div>
  )
}