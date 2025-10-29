import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import OnboardingPreviewPage from '@/app/onboarding/preview/page'

let axe: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  axe = require('jest-axe').axe
} catch (_e) {
  axe = async () => ({ violations: [] })
}

describe('Accessibility: Onboarding Preview Page (loader)', () => {
  const originalFetch = global.fetch
  const originalGetItem = window.localStorage.getItem

  beforeAll(() => {
    // Provide minimal quiz responses
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key: string) => {
      if (key === 'pourtrait_quiz_responses_v1') {
        return JSON.stringify([{ questionId: 'experience-level', value: 'expert' }])
      }
      return originalGetItem.call(window.localStorage, key)
    })
    // Mock preview API
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ data: { profile: {
      userId: 'test',
      stablePalate: { sweetness: 0.5, acidity: 0.6, tannin: 0.4, bitterness: 0.3, body: 0.5, alcoholWarmth: 0.4, sparkleIntensity: 0.3 },
      aromaAffinities: [],
      styleLevers: { oak: 0.2, malolacticButter: 0.1, oxidative: 0.2, minerality: 0.6, fruitRipeness: 0.5 },
      contextWeights: [],
      foodProfile: undefined,
      preferences: { novelty: 0.5, budgetTier: 'weekend', values: [] },
      dislikes: [],
      sparkling: {},
      wineKnowledge: 'expert',
      flavorMaps: {}
    }, summary: 'Sample summary' } }) })) as any
  })

  afterAll(() => {
    global.fetch = originalFetch
    ;(window.localStorage.getItem as any).mockRestore?.()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<OnboardingPreviewPage />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
    await waitFor(() => {
      expect(container.querySelector('h1')?.textContent?.toLowerCase()).toContain('pourtrait')
    })
  })
})


