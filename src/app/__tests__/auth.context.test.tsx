import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { useAuth } from '@/hooks/useAuth'

function ReadAuth() {
  const { user, initialized } = useAuth()
  return <div data-testid="u">{initialized ? (user ? 'yes' : 'no') : 'pending'}</div>
}

describe('Auth context provider', () => {
  it('surfaces initial server user state on first render', () => {
    const fakeUser = { id: 'u1' } as any
    const { getByTestId } = render(
      <AuthProvider initialSession={{} as any} initialUser={fakeUser}>
        <ReadAuth />
      </AuthProvider>
    )
    expect(getByTestId('u').textContent).toBe('yes')
  })
})



