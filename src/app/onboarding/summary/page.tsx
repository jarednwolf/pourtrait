'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { track } from '@/lib/utils/track'

export default function OnboardingSummaryPage() {
  const { getAccessToken, user } = useAuth()
  const [dbProfile, setDbProfile] = React.useState<any | null>(null)
  const [aiSummary, setAiSummary] = React.useState<string>('')
  const [loading, setLoading] = React.useState<boolean>(true)
  const headingRef = React.useRef<HTMLHeadingElement | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      track('onboarding_summary_viewed')
    }
    // Move focus for accessibility
    setTimeout(() => headingRef.current?.focus(), 0)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = await getAccessToken()
        if (!token) { return }
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` }
        const [profileRes, summaryRes] = await Promise.all([
          fetch('/api/profile/summary', { headers }),
          fetch('/api/profile/summary', { method: 'POST', headers, body: JSON.stringify({}) })
        ])
        if (!cancelled) {
          const p = await profileRes.json().catch(() => ({}))
          const s = await summaryRes.json().catch(() => ({}))
          setDbProfile(p?.data?.profile || null)
          setAiSummary(s?.data?.summary || '')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [getAccessToken])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-gray-900">Your taste profile</h1>
        <p className="text-gray-600 mt-2">Here’s what we learned from your answers. You can refine this anytime.</p>

        <div className="mt-8">
          {loading ? (
            <Card className="p-6">Loading your profile…</Card>
          ) : (
            <ProfileSummary dbProfile={dbProfile || {}} summary={aiSummary} />
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Button asChild onClick={() => track('cta_get_picks_clicked', { source: 'onboarding_summary' })}>
            <a href="/dashboard?show=recs=1" aria-label="Go to dashboard to get recommendations">Get Picks</a>
          </Button>
          {user ? (
            <Button asChild variant="outline">
              <a href="/profile" aria-label="View full profile insights">View profile insights</a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}


