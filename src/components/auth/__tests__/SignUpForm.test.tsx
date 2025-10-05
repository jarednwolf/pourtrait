import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '../SignUpForm'
import { AuthService } from '@/lib/auth'

// Mock AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    signUp: vi.fn(),
    signInWithProvider: vi.fn(),
    resendConfirmation: vi.fn(),
  },
  getAuthErrorMessage: vi.fn((error) => error.message),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('SignUpForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign up form', () => {
    render(<SignUpForm />)

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/wine experience level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should handle successful sign up with immediate confirmation', async () => {
    const mockOnSuccess = vi.fn()
    vi.mocked(AuthService.signUp).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token' },
      needsEmailConfirmation: false,
    } as any)

    render(<SignUpForm onSuccess={mockOnSuccess} />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.selectOptions(screen.getByLabelText(/wine experience level/i), 'intermediate')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(AuthService.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        experienceLevel: 'intermediate',
      })
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show email confirmation screen when needed', async () => {
    vi.mocked(AuthService.signUp).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      session: null,
      needsEmailConfirmation: true,
    } as any)

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })
  })

  it('should validate password confirmation', async () => {
    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    expect(AuthService.signUp).not.toHaveBeenCalled()
  })

  it('should validate password length', async () => {
    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), '123')
    await user.type(screen.getByLabelText(/confirm password/i), '123')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })

    expect(AuthService.signUp).not.toHaveBeenCalled()
  })

  it('should display error on sign up failure', async () => {
    vi.mocked(AuthService.signUp).mockRejectedValue(new Error('Email already registered'))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
    })
  })

  it('should handle OAuth sign up', async () => {
    vi.mocked(AuthService.signInWithProvider).mockResolvedValue({
      url: 'https://oauth-url.com',
    } as any)

    render(<SignUpForm />)

    const googleButton = screen.getByRole('button', { name: /sign up with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(AuthService.signInWithProvider).toHaveBeenCalledWith('google')
    })
  })

  it('should handle resend confirmation', async () => {
    vi.mocked(AuthService.signUp).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      session: null,
      needsEmailConfirmation: true,
    } as any)

    vi.mocked(AuthService.resendConfirmation).mockResolvedValue()

    render(<SignUpForm />)

    // Complete sign up to get to confirmation screen
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    })

    // Click resend button
    const resendButton = screen.getByRole('button', { name: /resend confirmation email/i })
    await act(async () => {
      await user.click(resendButton)
    })

    await waitFor(() => {
      expect(AuthService.resendConfirmation).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('should render navigation links', () => {
    render(<SignUpForm />)

    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})