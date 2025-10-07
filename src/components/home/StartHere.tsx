"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

export function StartHere() {
  const items = [
    { icon: 'zap', title: "Tonight's Pick", href: '/chat?q=' + encodeURIComponent("What should I drink tonight?") + '&send=1', event: 'cta_tonights_pick_click' },
    { icon: 'clipboard-list', title: 'Pair a Dish', href: '#mini-pairing', event: 'pairing_cta_click' },
    { icon: 'save', title: 'Build My Cellar', href: '/inventory', event: 'inventory_opened' }
  ] as const

  return null
}


