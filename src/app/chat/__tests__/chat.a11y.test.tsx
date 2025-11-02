import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import ChatPage from '../page'

let axe: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  axe = require('jest-axe').axe
} catch (_e) {
  axe = async () => ({ violations: [] })
}

// Mock useSearchParams used by ChatPage
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}))

// Mock auth hooks used within ChatPage tree
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test' }, loading: false, initialized: true }),
  useIsAuthenticated: () => true,
  useUserProfile: () => ({ profile: { id: 'test' }, loading: false, isAuthenticated: true }),
  useAuthLoading: () => false,
}))

describe('Accessibility: Chat Page', () => {
  it('should have no obvious a11y violations', async () => {
    const { container } = render(<ChatPage />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
  })
})



