import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '../SignInForm'
import { AuthService } from '@/lib/auth'

// Mock AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    signIn: vi.fn(),
    signInWithProvider: vi.fn(),
  },
  getAuthErrorMessage: vi.fn((error) => error.message),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('SignInForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign in form', () => {
    render(<SignInForm />)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('should handle successful sign in', async () => {
    const mockOnSuccess = vi.fn()
    vi.mocked(AuthService.signIn).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token' },
    } as any)

    render(<SignInForm onSuccess={mockOnSuccess} />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(AuthService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should display error on sign in failure', async () => {
    vi.mocked(AuthService.signIn).mockRejectedValue(new Error('Invalid credentials'))

    render(<SignInForm />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should handle OAuth sign in', async () => {
    vi.mocked(AuthService.signInWithProvider).mockResolvedValue({
      url: 'https://oauth-url.com',
    } as any)

    render(<SignInForm />)

    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(AuthService.signInWithProvider).toHaveBeenCalledWith('google')
    })
  })

  it('should disable form during loading', async () => {
    vi.mocked(AuthService.signIn).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<SignInForm />)

    const submitButton = screen.getByRole('button', { name: /^sign in$/i })
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    expect(AuthService.signIn).not.toHaveBeenCalled()
  })

  it('should render navigation links', () => {
    render(<SignInForm />)

    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })
})