"use client"
import { useEffect, useRef } from 'react'

interface UseImpressionOptions {
  once?: boolean
  threshold?: number
  margin?: string
  onImpress: () => void
}

export function useImpression({ once = true, threshold = 0.3, margin = '0px', onImpress }: UseImpressionOptions) {
  const ref = useRef<HTMLElement | null>(null)
  const didFire = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || (once && didFire.current)) { return }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          if (once && didFire.current) { return }
          didFire.current = true
          onImpress()
          if (once) { obs.disconnect() }
        }
      })
    }, { root: null, rootMargin: margin, threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [once, threshold, margin, onImpress])

  return ref as unknown as React.RefObject<HTMLDivElement>
}


