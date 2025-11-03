import { describe, it, expect, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import React from 'react'
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Force AuthProvider to stay uninitialized/loading to exercise timeout fallback
vi.mock('@/hooks/useAuthInternal', () => ({
  useAuthInternal: () => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,
    signOut: vi.fn(),
    refreshUser: vi.fn(),
    getAccessToken: vi.fn(),
    refreshProfile: vi.fn(),
  })
}))

function Dummy() {
  return <div data-testid="ok">ok</div>
}

describe('Auth flow basics', () => {
  it('renders spinner before auth initialized, then shows timeout fallback after 15s', async () => {
    vi.useFakeTimers()
    const { getByRole, queryByText } = render(
      <AuthProvider initialSession={null} initialUser={null}>
        <ProtectedRoute>
          <Dummy />
        </ProtectedRoute>
      </AuthProvider>
    )
    // loading present
    expect(getByRole('status')).toBeTruthy()
    // advance 15s to trigger timeout fallback UI
    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    expect(getByRole('alert')).toBeTruthy()
    vi.useRealTimers()
  })
})


