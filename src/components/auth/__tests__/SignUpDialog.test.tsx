import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { SignUpDialog } from '@/components/auth/SignUpDialog'

vi.stubGlobal('window', Object.assign(window, { addEventListener: vi.fn(), removeEventListener: vi.fn() }))

describe('SignUpDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when opened externally', () => {
    const { getByRole } = render(<SignUpDialog openExternally />)
    expect(getByRole('dialog')).toBeInTheDocument()
  })
})


