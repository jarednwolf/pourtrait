'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { track } from '@/lib/utils/track'
import type { UserProfileInput } from '@/lib/profile/schema'
import { useAuth } from '@/hooks/useAuth'

const QUIZ_KEY = 'pourtrait_quiz_responses_v1'
const PREVIEW_KEY = 'pourtrait_profile_preview_v1'

function mapProfileToDisplay(profile: UserProfileInput) {
  return {
    sweetness: profile.stablePalate.sweetness,
    acidity: profile.stablePalate.acidity,
    tannin: profile.stablePalate.tannin,
    bitterness: profile.stablePalate.bitterness,
    body: profile.stablePalate.body,
    alcohol_warmth: profile.stablePalate.alcoholWarmth,
    sparkle_intensity: profile.stablePalate.sparkleIntensity,
    oak: profile.styleLevers.oak,
    malolactic_butter: profile.styleLevers.malolacticButter,
    oxidative: profile.styleLevers.oxidative,
    minerality: profile.styleLevers.minerality,
    fruit_ripeness: profile.styleLevers.fruitRipeness,
    dislikes: profile.dislikes || [],
  }
}

export default function OnboardingPreviewPage() {
  const router = useRouter()
  const { user, getAccessToken } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [summary, setSummary] = React.useState<string>('')
  const [display, setDisplay] = React.useState<any | null>(null)
  const headingRef = React.useRef<HTMLHeadingElement | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      track('preview_viewed')
    }
    setTimeout(() => headingRef.current?.focus(), 0)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(QUIZ_KEY) : null
        if (!raw) {
          router.replace('/onboarding/step1')
          return
        }
        const responses = JSON.parse(raw)
        if (!Array.isArray(responses)) {
          window.localStorage.removeItem(QUIZ_KEY)
          router.replace('/onboarding/step1')
          return
        }

        const responseMap = new Map(responses.map((r: any) => [r.questionId, r.value]))
        const exp = responseMap.get('experience-level')
        const freeTextAnswers: Record<string, string> = {}
        responses.forEach((r: any) => { if (typeof r.value === 'string') freeTextAnswers[r.questionId] = r.value })

        track('preview_map_started', { exp })
        const res = await fetch('/api/profile/map/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience: exp, freeTextAnswers })
        })
        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          track('preview_map_failed', { status: res.status, body: errText?.slice?.(0, 200) })
          throw new Error('preview mapping failed')
        }
        const { data } = await res.json()
        const prof: UserProfileInput | null = data?.profile || null
        const sum: string = data?.summary || ''
        if (!cancelled && prof) {
          const disp = mapProfileToDisplay(prof)
          setDisplay(disp)
          setSummary(sum)
          try {
            window.localStorage.setItem(PREVIEW_KEY, JSON.stringify({ profile: prof, summary: sum }))
          } catch {}
          track('preview_map_completed')

          // If the user is already authenticated, upsert immediately
          if (user) {
            try {
              const token = await getAccessToken()
              if (token) {
                await fetch('/api/profile/upsert', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify(prof)
                })
                await fetch('/api/interactions/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ reasons: ['profile_created'], context: { source: 'preview_authed', used_llm: true } })
                }).catch(() => {})
              }
            } catch {}
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50" aria-busy={loading || undefined}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-gray-900">Painting your pourtrait…</h1>
        <p className="text-gray-600 mt-2">This can take 1–2 minutes while we translate your answers into a personalized taste profile.</p>

        <div className="mt-8">
          {loading ? (
            <Card className="p-6">Analyzing your preferences…</Card>
          ) : (
            display ? (
              <>
                <ProfileSummary dbProfile={display} summary={summary} />
                <div className="mt-8 flex gap-3">
                  {user ? (
                    <Button asChild>
                      <a href="/dashboard?show=recs=1" aria-label="Continue to your dashboard">Continue to dashboard</a>
                    </Button>
                  ) : (
                    <Button asChild onClick={() => track('preview_signup_clicked')}>
                      <a href="/auth/signup?next=/dashboard" aria-label="Create account to save your profile">Save my profile</a>
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <a href="/onboarding/step1">Refine answers</a>
                  </Button>
                </div>
              </>
            ) : (
              <Card className="p-6">We couldn’t generate a preview. Please try again.</Card>
            )
          )}
        </div>
      </div>
    </div>
  )
}


