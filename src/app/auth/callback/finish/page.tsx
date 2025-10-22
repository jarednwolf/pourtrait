'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { calculateStructuredUserProfile } from '@/lib/onboarding/quiz-calculator'
import type { QuizResponse } from '@/lib/onboarding/quiz-data'

export default function AuthCallbackFinishPage() {
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
        const LOCAL_KEY = 'pourtrait_quiz_responses_v1'
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_KEY) : null

        if (!raw) {
          if (!cancelled) router.replace(nextParam)
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
        const token = await getAccessToken()

        // Default: if no token for some reason, just route forward
        if (!token) {
          window.localStorage.removeItem(LOCAL_KEY)
          if (!cancelled) router.replace(nextParam)
          return
        }

        if (exp === 'intermediate' || exp === 'expert') {
          // Build free-text payload from responses
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
          // Novice/beginner path – compute structured profile locally
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

        window.localStorage.removeItem(LOCAL_KEY)
      } catch (err) {
        // Non-fatal: proceed to app regardless
      } finally {
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


