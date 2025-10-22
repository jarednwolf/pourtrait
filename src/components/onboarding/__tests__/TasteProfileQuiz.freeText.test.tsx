import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingFlow } from '../OnboardingFlow'

describe('OnboardingFlow exploring/expert free-text mapping', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
    // Mock auth hook
    vi.mock('@/hooks/useAuth', () => ({
      useAuth: () => ({ user: { id: 'user_1' }, getAccessToken: async () => 'token' })
    }))
    // Mock fetch for mapper and upsert
    global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/api/profile/map')) {
        return new Response(JSON.stringify({ success: true, data: { profile: { userId: 'user_1', stablePalate: { sweetness: 0.5, acidity: 0.5, tannin: 0.5, bitterness: 0.5, body: 0.5, alcoholWarmth: 0.5, sparkleIntensity: 0.5 }, aromaAffinities: [], styleLevers: { oak: 0.3, malolacticButter: 0.2, oxidative: 0.2, minerality: 0.5, fruitRipeness: 0.5 }, contextWeights: [], preferences: { novelty: 0.5, budgetTier: 'weekend', values: [] }, dislikes: [], sparkling: {}, wineKnowledge: 'intermediate', flavorMaps: {} }, summary: 'ok' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (typeof url === 'string' && url.includes('/api/profile/upsert')) {
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }) as unknown as typeof fetch
  })

  it('submits free-text for exploring and calls mapper, then upsert', async () => {
    render(<OnboardingFlow onComplete={mockOnComplete} />)

    // Start
    fireEvent.click(screen.getByText('Start Taste Profile Quiz'))

    // Select Exploring experience
    fireEvent.click(screen.getByText(/Exploring/i))
    fireEvent.click(screen.getByText('Next'))

    // We should now be on a free-text question; type something
    const textarea = await screen.findByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Loved Pinot Noir with salmon' } })

    // Fast-forward to end: click Next until Finish is enabled
    // For brevity, simulate finishing by advancing several times
    for (let i = 0; i < 4; i++) {
      const btn = screen.getByRole('button', { name: /Next|Finish/ })
      fireEvent.click(btn)
    }

    // The quiz shows results screen; proceed to completion step
    await waitFor(() => expect(screen.getByText(/Create account to save your profile/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Create account to save your profile/))

    // Now on the onboarding complete screen
    await waitFor(() => expect(screen.getByText(/Start Exploring Wines/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Start Exploring Wines/))

    await waitFor(() => {
      expect((global.fetch as unknown as jest.Mock) || (global.fetch as any)).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/map'),
        expect.objectContaining({ method: 'POST' })
      )
      expect((global.fetch as unknown as jest.Mock) || (global.fetch as any)).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/upsert'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})


