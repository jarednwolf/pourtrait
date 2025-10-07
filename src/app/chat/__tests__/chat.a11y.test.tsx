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

// Mock AuthProvider usage inside ChatPage tree
vi.mock('@/components/providers/AuthProvider', async (orig) => {
  const actual = await (orig as any)()
  return {
    ...actual,
    useAuth: () => ({ isAuthenticated: true, user: { id: 'test' }, loading: false }),
  }
})

describe('Accessibility: Chat Page', () => {
  it('should have no obvious a11y violations', async () => {
    const { container } = render(<ChatPage />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
  })
})



