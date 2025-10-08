import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { AuthGate } from '@/components/auth/AuthGate'

vi.stubGlobal('window', Object.assign(window, { dispatchEvent: vi.fn() }))

describe('AuthGate', () => {
  beforeEach(() => {
    // ensure no stored intent
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
  })

  it('wraps children and prevents default for anonymous users', () => {
    const onClick = vi.fn()
    render(
      <AuthGate action={{ type: 'chat', params: { q: 'Hello' } }}>
        <button onClick={onClick}>Click</button>
      </AuthGate>
    )
    const btn = screen.getByRole('button', { name: 'Click' })
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})


