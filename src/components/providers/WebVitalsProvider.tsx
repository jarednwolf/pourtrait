'use client'

import { useEffect } from 'react'
import { trackWebVitals } from '@/lib/monitoring/performance'

export function WebVitalsProvider() {
  useEffect(() => {
    trackWebVitals()
  }, [])
  return null
}



