"use client"
import React from 'react'
import { useAuth } from '@/hooks/useAuth'

export function DashboardHeaderInfo() {
  const { user, getAccessToken } = useAuth()
  const [summary, setSummary] = React.useState<{ totalWines: number; hasTasteProfile: boolean; readyNow?: number; readySoon?: number; lastActivity?: string } | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) { return }
        const [exportRes, invRes] = await Promise.all([
          fetch('/api/data/export', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/inventory/summary', { headers: { Authorization: `Bearer ${token}` } })
        ])
        const exportJson = await exportRes.json().catch(() => ({}))
        const invJson = await invRes.json().catch(() => ({}))
        if (!cancelled) setSummary({ totalWines: invJson?.data?.total ?? exportJson?.totalWines ?? 0, hasTasteProfile: !!exportJson?.hasTasteProfile, readyNow: invJson?.data?.readyNow ?? 0, readySoon: invJson?.data?.readySoon ?? 0, lastActivity: exportJson?.lastActivity })
      } catch {}
    }
    run()
    return () => { cancelled = true }
  }, [getAccessToken])

  return (
    <>
      <h1 className="font-serif text-heading-2">{`Welcome back${user?.profile?.name ? `, ${user.profile.name}` : ''}`}</h1>
      {summary && (
        <p className="mt-1 text-sm text-gray-600" aria-live="polite">
          {summary.readyNow ?? 0} ready now • {summary.readySoon ?? 0} ready soon • {summary.totalWines} {summary.totalWines === 1 ? 'bottle' : 'bottles'} • {summary.hasTasteProfile ? 'Profile calibrated' : 'Profile not calibrated'}{summary.lastActivity ? ` • Last activity ${new Date(summary.lastActivity).toLocaleDateString()}` : ''}
        </p>
      )}
    </>
  )
}


