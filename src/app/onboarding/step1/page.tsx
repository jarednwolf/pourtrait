'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/utils/track'
import { TasteProfileQuiz } from '@/components/onboarding/TasteProfileQuiz'
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
        <TasteProfileQuiz onComplete={() => {
          track('quiz_completed')
          if (user) {
            router.push('/onboarding/completed')
          } else {
            track('signup_from_quiz_started')
            router.push('/auth/signup')
          }
        }} />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Create an account to save these answers to your profile.</p>
          <a href="/auth/signup" className="text-primary underline" aria-label="Create account to save your quiz answers" onClick={() => track('signup_from_quiz_started')}>Create account to save your quiz answers</a>
        </div>
      </div>
    </div>
  )
}

// Metadata must not be exported in client components. Title is set via layout.


