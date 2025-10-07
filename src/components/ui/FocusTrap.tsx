'use client'

import React, { useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  onEscape?: () => void
  initialFocusRef?: React.RefObject<HTMLElement>
  restoreFocus?: boolean
  className?: string
}

/**
 * Lightweight focus trap for modals/overlays.
 * - Traps Tab/Shift+Tab within container
 * - Moves initial focus to first focusable or provided ref
 * - Restores focus on unmount when restoreFocus is true
 * - Handles Escape to close when onEscape is provided
 */
export function FocusTrap({
  children,
  active = true,
  onEscape,
  initialFocusRef,
  restoreFocus = true,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) {return}

    previouslyFocusedRef.current = document.activeElement as HTMLElement

    const containerEl = containerRef.current
    if (!containerEl) {return}

    const getFocusable = (): HTMLElement[] => {
      const nodes = containerEl.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, summary, [tabindex]:not([tabindex="-1"])'
      )
      return Array.from(nodes).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
    }

    const focusFirst = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
        return
      }
      const focusables = getFocusable()
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        // Fallback focus to container to keep focus inside
        containerEl.tabIndex = -1
        containerEl.focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onEscape) {
          e.stopPropagation()
          e.preventDefault()
          onEscape()
        }
        return
      }
      if (e.key !== 'Tab') {return}
      const focusables = getFocusable()
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement as HTMLElement
      if (e.shiftKey) {
        if (current === first || !containerEl.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (current === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    focusFirst()
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (restoreFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [active, onEscape, initialFocusRef, restoreFocus])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}



