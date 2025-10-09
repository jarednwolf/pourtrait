"use client"
import React from 'react'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const items = [
    { href: '/(auth)/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/inventory', label: 'Cellar', icon: 'grid' },
    { href: '/chat', label: 'Sommelier', icon: 'sparkles' },
    { href: '/restaurant-scanner', label: 'Scan', icon: 'camera' },
    { href: '/settings', label: 'Profile', icon: 'user' },
  ] as const

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-dark-surface">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map((it) => (
          <li key={it.href} className="flex">
            <a
              href={it.href}
              aria-label={it.label}
              aria-current={pathname && pathname.startsWith(it.href.replace('/(auth)','')) ? 'page' : undefined}
              onClick={() => track('nav_click', { item: it.label })}
              className="flex-1 py-3 text-center text-xs text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <Icon name={it.icon as any} className="mx-auto mb-1 h-5 w-5 text-gray-800" aria-hidden="true" />
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}


