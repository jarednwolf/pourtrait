"use client"
import React, { useEffect, useRef } from 'react'
import { FocusTrap } from '@/components/ui/FocusTrap'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

interface DemoModalProps {
  open: boolean
  demoId: 'taste' | 'alerts' | 'chat' | null
  onClose: () => void
}

export function DemoModal({ open, demoId, onClose }: DemoModalProps) {
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) { return }
    track('home_demo_viewed', { demo: demoId || 'unknown' })
  }, [open, demoId])

  if (!open || !demoId) { return null }

  const getTitle = () => {
    switch(demoId) {
      case 'taste': return 'See your taste profile in action'
      case 'alerts': return 'How drink‑window alerts work'
      case 'chat': return 'Chat with your personal sommelier'
      default: return 'Demo'
    }
  }

  const getBody = () => {
    switch(demoId) {
      case 'taste':
        return 'Adjust a few sliders and we’ll start tailoring recommendations instantly.'
      case 'alerts':
        return 'Pourtrait tracks when each bottle is entering its peak and nudges you politely.'
      case 'chat':
        return 'Ask things like “I’m cooking salmon—what should I open?” and get clear picks.'
      default:
        return ''
    }
  }

  const openSignup = () => {
    try { window.dispatchEvent(new CustomEvent('open-signup-dialog')); track('cta_signup_clicked', { source: 'home_demo' }) } catch {}
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="demo-title" aria-describedby="demo-desc">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <FocusTrap className="relative mx-auto mt-16 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200 dark:bg-dark-surface dark:ring-gray-800" initialFocusRef={closeBtn}>
        <div className="flex items-start justify-between">
          <div>
            <h3 id="demo-title" className="text-xl font-semibold text-gray-900">{getTitle()}</h3>
            <p id="demo-desc" className="text-sm text-gray-600 mt-1">{getBody()}</p>
          </div>
          <button ref={closeBtn} onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700">
            <Icon name="x-mark" className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800">
          This is a short teaser. Create your free account to continue.
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn bg-primary text-white rounded-lg h-10 px-4" onClick={openSignup}>Create your free account</button>
          <button className="btn border border-gray-300 rounded-lg h-10 px-4" onClick={onClose}>Maybe later</button>
        </div>
      </FocusTrap>
    </div>
  )
}


