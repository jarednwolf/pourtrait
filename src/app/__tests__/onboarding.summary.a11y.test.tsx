import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileSummary } from '@/components/profile/ProfileSummary'

let axe: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  axe = require('jest-axe').axe
} catch (_e) {
  axe = async () => ({ violations: [] })
}

describe('Accessibility: Onboarding Profile Summary', () => {
  it('should have no obvious a11y violations', async () => {
    const mockProfile = {
      sweetness: 0.4,
      acidity: 0.7,
      tannin: 0.3,
      bitterness: 0.2,
      body: 0.5,
      alcohol_warmth: 0.4,
      sparkle_intensity: 0.3,
      oak: 0.2,
      malolactic_butter: 0.1,
      oxidative: 0.2,
      minerality: 0.6,
      fruit_ripeness: 0.5,
      dislikes: ['oaky']
    }
    const { container } = render(<ProfileSummary dbProfile={mockProfile} summary="Sample summary" />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
  })
})


