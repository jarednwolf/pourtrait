'use client'

import React from 'react'
import { RestaurantWineListScanner } from '@/components/wine/RestaurantWineListScanner'

export default function RestaurantScannerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RestaurantWineListScanner />
      </div>
    </div>
  )
}