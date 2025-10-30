'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { track } from '@/lib/utils/track'

export default function ProfileInsightsPage() {
  const { getAccessToken } = useAuth()
  const [dbProfile, setDbProfile] = React.useState<any | null>(null)
  const [aiSummary, setAiSummary] = React.useState<string>('')
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      track('profile_insights_viewed')
    }
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
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile insights</h1>
        <p className="text-gray-600 mt-2">Your current palate profile and AI summary.</p>

        <div className="mt-8">
          {loading ? (
            <Card className="p-6">Loading…</Card>
          ) : (
            <ProfileSummary dbProfile={dbProfile || {}} summary={aiSummary} />
          )}
        </div>

        <div className="mt-8">
          <Button asChild variant="outline"><a href="/onboarding/step1">Recalibrate my palate</a></Button>
        </div>
      </div>
    </ProtectedRoute>
  )
}


