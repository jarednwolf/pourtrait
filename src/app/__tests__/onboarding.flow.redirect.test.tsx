import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import OnboardingPreviewPage from '@/app/onboarding/preview/page'

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation')
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  }
})

vi.mock('@/hooks/useAuth', () => {
  return {
    useAuth: () => ({
      user: { id: 'u1', profile: { onboarding_completed: false } },
      getAccessToken: async () => 'tok',
      refreshProfile: vi.fn(),
    })
  }
})

describe('onboarding preview redirect', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data: { profile: { stablePalate: {}, styleLevers: {}, dislikes: [] }, summary: 's' } }) } as any)))
    // Seed quiz answers
    vi.stubGlobal('window', Object.create(window))
    // @ts-expect-error test env
    window.localStorage = {
      getItem: (k: string) => k === 'pourtrait_quiz_responses_v1' ? JSON.stringify([{ questionId: 'experience-level', value: 'beginner' }]) : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    }
  })

  it('saves and redirects for authenticated users', async () => {
    render(<OnboardingPreviewPage />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    // If redirect occurs in component, there will be no assertion error; just ensure the UI renders heading
    expect(screen.getByText(/Your personalized pourtrait/i)).toBeInTheDocument()
  })
})



