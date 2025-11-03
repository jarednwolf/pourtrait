'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { calculateStructuredUserProfile } from '@/lib/onboarding/quiz-calculator'
import type { QuizResponse } from '@/lib/onboarding/quiz-data'

function FinishClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next') || '/dashboard'
  const { user, initialized, loading, getAccessToken } = useAuth()

  React.useEffect(() => {
    if (!initialized || loading) { return }
    if (!user) {
      router.replace('/auth/signin')
      return
    }

    let cancelled = false

    const finalizeProfile = async () => {
      try {
        const PREVIEW_KEY = 'pourtrait_profile_preview_v1'
        const LOCAL_KEY = 'pourtrait_quiz_responses_v1'
        const previewRaw = typeof window !== 'undefined' ? window.localStorage.getItem(PREVIEW_KEY) : null
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_KEY) : null

        const token = await getAccessToken()
        if (!token) {
          if (!cancelled) router.replace(nextParam)
          return
        }

        // If a preview profile exists, upsert it immediately
        if (previewRaw) {
          try {
            const parsedPreview = JSON.parse(previewRaw)
            const previewProfile = parsedPreview?.profile
            if (previewProfile) {
              await fetch('/api/profile/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(previewProfile)
              })
              // Track profile_created via interactions API (reusing event schema)
              await fetch('/api/interactions/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reasons: ['profile_created'], context: { source: 'preview', used_llm: true } })
              }).catch(() => {})
            }
          } catch {}
        }

        if (!raw) {
          if (!cancelled) router.replace(nextParam)
          // Clear preview key if present
          if (typeof window !== 'undefined') { window.localStorage.removeItem(PREVIEW_KEY) }
          return
        }

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
          window.localStorage.removeItem(LOCAL_KEY)
          if (!cancelled) router.replace(nextParam)
          return
        }

        const responses: QuizResponse[] = parsed.map((r: any) => ({
          questionId: r.questionId,
          value: r.value,
          timestamp: new Date(r.timestamp || Date.now())
        }))

        const responseMap = new Map(responses.map(r => [r.questionId, r.value]))
        const exp = responseMap.get('experience-level') as string | undefined
        

        if (exp === 'intermediate' || exp === 'expert') {
          const freeTextAnswers: Record<string, string> = {}
          responses.forEach(r => {
            if (typeof r.value === 'string') {
              freeTextAnswers[r.questionId] = r.value as string
            }
          })

          const mapRes = await fetch('/api/profile/map', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ experience: exp, freeTextAnswers })
          })

          if (mapRes.ok) {
            const mapped = await mapRes.json()
            const profile = mapped?.data?.profile
            if (profile) {
              await fetch('/api/profile/upsert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profile)
              })
            }
          }
        } else {
          const structured = calculateStructuredUserProfile(user.id, responses)
          await fetch('/api/profile/upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(structured)
          })
        }

        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(LOCAL_KEY)
          window.localStorage.removeItem(PREVIEW_KEY)
        }
      } catch (err) {
        // Non-fatal: proceed to app regardless
      } finally {
        // After finalizing, send user to intended destination (default /dashboard)
        if (!cancelled) router.replace(nextParam)
      }
    }

    finalizeProfile()

    return () => { cancelled = true }
  }, [initialized, loading, user, router, getAccessToken, nextParam])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-700">
        <div className="animate-pulse mb-3">Completing your setup…</div>
        <div className="text-sm text-gray-500">This only takes a moment.</div>
      </div>
    </div>
  )
}

export default function AuthCallbackFinishPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-700">
          <div className="animate-pulse mb-3">Preparing your account…</div>
        </div>
      </div>
    }>
      <FinishClient />
    </Suspense>
  )
}


