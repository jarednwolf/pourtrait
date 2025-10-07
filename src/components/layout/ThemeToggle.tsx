"use client"
import React, { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState<boolean>(false)

  useEffect(() => {
    // Always default to light mode on first load
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const shouldDark = stored === 'dark' // Only dark if explicitly set
    setDark(shouldDark)
    
    // Remove dark class immediately on mount
    document.documentElement.classList.remove('dark')
    
    // Then apply if needed
    if (shouldDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-9 w-9',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
        'dark:bg-dark-surface dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800',
        className
      ].filter(Boolean).join(' ')}
    >
      <Icon name={dark ? 'sun' : 'moon'} aria-hidden className="" />
    </button>
  )
}


