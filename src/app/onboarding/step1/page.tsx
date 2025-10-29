'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/utils/track'
import { TasteProfileQuiz } from '@/components/onboarding/TasteProfileQuiz'
import { calculateStructuredUserProfile } from '@/lib/onboarding/quiz-calculator'
import { upsertUserProfile } from '@/lib/profile/persist'
import { useAuth } from '@/hooks/useAuth'

export default function OnboardingStep1() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    track('onboarding_started')
  }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <TasteProfileQuiz onComplete={(_result) => {
          track('quiz_completed')
          track('preview_started')
          router.push('/onboarding/preview')
        }} />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Create an account to save these answers to your profile.</p>
          <a href="/onboarding/preview" className="text-primary underline" aria-label="Preview your personalized profile" onClick={() => track('preview_started')}>Preview your personalized profile</a>
        </div>
      </div>
    </div>
  )
}

// Metadata must not be exported in client components. Title is set via layout.


