"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/hooks/useAuth'
import { track } from '@/lib/utils/track'

/**
 * PrimaryActionRow: quick entry points that drive the first meaningful actions.
 * - Start/Resume profile
 * - Add first bottle
 * - Ask Sommelier
 */
export function PrimaryActionRow() {
  const { getAccessToken } = useAuth()
  const [hasProfile, setHasProfile] = React.useState<boolean>(false)
  const [totalWines, setTotalWines] = React.useState<number>(0)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) { return }
        const [profileRes, exportRes] = await Promise.all([
          fetch('/api/profile/summary', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/data/export', { headers: { Authorization: `Bearer ${token}` } })
        ])
        const profileJson = await profileRes.json().catch(() => ({}))
        const exportJson = await exportRes.json().catch(() => ({}))
        if (!cancelled) {
          setHasProfile(Boolean(profileJson?.data?.profile) || !!exportJson?.hasTasteProfile)
          setTotalWines(exportJson?.totalWines || 0)
        }
      } catch {}
    }
    run()
    return () => { cancelled = true }
  }, [getAccessToken])

  return (
    <nav aria-label="Quick actions" className="overflow-x-auto -mx-4 px-4">
      <ul className="mx-auto flex max-w-6xl gap-2 sm:gap-3">
        <li>
          <Button asChild variant="outline" size="sm" className="min-w-[128px]" onClick={() => track('primary_row_click', { item: hasProfile ? 'Recalibrate' : 'Start profile' })}>
            <a href="/onboarding/step1" aria-label={hasProfile ? 'Recalibrate profile' : 'Start taste profile'}>
              <Icon name="sparkles" className="mr-2 h-4 w-4" aria-hidden="true" />
              {hasProfile ? 'Recalibrate' : 'Start profile'}
            </a>
          </Button>
        </li>
        <li>
          <Button asChild variant="outline" size="sm" className="min-w-[128px]" onClick={() => track('primary_row_click', { item: totalWines > 0 ? 'Log bottle' : 'Add bottle' })}>
            <a href="/inventory?action=add" aria-label={totalWines > 0 ? 'Log a bottle' : 'Add your first bottle'}>
              <Icon name="plus" className="mr-2 h-4 w-4" aria-hidden="true" />
              {totalWines > 0 ? 'Log bottle' : 'Add bottle'}
            </a>
          </Button>
        </li>
        <li>
          <Button asChild variant="outline" size="sm" className="min-w-[128px]" onClick={() => track('primary_row_click', { item: 'Ask Sommelier' })}>
            <a href="/chat?q=What%20should%20I%20drink%20tonight%3F&send=1" aria-label="Ask the Sommelier a question">
              <Icon name="chat-bubble-left" className="mr-2 h-4 w-4" aria-hidden="true" />
              Ask Sommelier
            </a>
          </Button>
        </li>
      </ul>
    </nav>
  )
}


