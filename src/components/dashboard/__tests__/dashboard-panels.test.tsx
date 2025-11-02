import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SommChatPanel } from '../SommChatPanel'
import { MyCellarPanel } from '../MyCellarPanel'
import { YourPourtraitPanel } from '../YourPourtraitPanel'

// Minimal mocks to avoid network/auth during panel unit tests
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: undefined, getAccessToken: async () => null }),
}))

// Silence analytics tracking in tests
vi.mock('@/lib/utils/track', () => ({ track: vi.fn() }))

describe('Dashboard Panels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders SommChatPanel with primary CTA and chips', () => {
    render(<SommChatPanel />)
    expect(screen.getByRole('region', { name: /sommelier chat/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ask a question/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tonight's pick/i })).toBeInTheDocument()
  })

  it('renders MyCellarPanel with actions', () => {
    render(<MyCellarPanel />)
    expect(screen.getByRole('region', { name: /my cellar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view inventory/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add bottle/i })).toBeInTheDocument()
  })

  it('renders YourPourtraitPanel with actions', () => {
    render(<YourPourtraitPanel />)
    expect(screen.getByRole('region', { name: /your pourtrait/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view insights/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /recalibrate/i })).toBeInTheDocument()
  })
})


