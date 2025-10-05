/**
 * PWA Install Prompt Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PWAInstallPrompt, PWAInstallButton } from '../PWAInstallPrompt'
import { usePWA } from '@/hooks/usePWA'

// Mock the usePWA hook
vi.mock('@/hooks/usePWA')
const mockUsePWA = usePWA as any

// Mock the Button and Card components
vi.mock('../Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('../Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('../Icon', () => ({
  Icon: ({ name, className }: any) => (
    <span className={className} data-icon={name} />
  ),
}))

describe('PWAInstallPrompt', () => {
  const mockPromptInstall = vi.fn()
  const mockOnInstall = vi.fn()
  const mockOnDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    mockUsePWA.mockReturnValue({
      canInstall: true,
      isStandalone: false,
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render initially', () => {
    render(<PWAInstallPrompt />)
    expect(screen.queryByText('Install Pourtrait')).not.toBeInTheDocument()
  })

  it('should render after delay when installable', async () => {
    render(<PWAInstallPrompt />)
    
    // Fast-forward time to trigger the delay
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText('Install Pourtrait')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Add Pourtrait to your home screen/)).toBeInTheDocument()
    expect(screen.getByText('Install App')).toBeInTheDocument()
    expect(screen.getByText('Not Now')).toBeInTheDocument()
  })

  it('should not render when already standalone', () => {
    mockUsePWA.mockReturnValue({
      canInstall: true,
      isStandalone: true,
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })

    render(<PWAInstallPrompt />)
    vi.advanceTimersByTime(3000)
    
    expect(screen.queryByText('Install Pourtrait')).not.toBeInTheDocument()
  })

  it('should not render when cannot install', () => {
    mockUsePWA.mockReturnValue({
      canInstall: false,
      isStandalone: false,
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })

    render(<PWAInstallPrompt />)
    vi.advanceTimersByTime(3000)
    
    expect(screen.queryByText('Install Pourtrait')).not.toBeInTheDocument()
  })

  it('should handle install button click', async () => {
    mockPromptInstall.mockResolvedValue(true)
    
    render(<PWAInstallPrompt onInstall={mockOnInstall} />)
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Install App'))
    
    await waitFor(() => {
      expect(mockPromptInstall).toHaveBeenCalled()
      expect(mockOnInstall).toHaveBeenCalled()
    })
  })

  it('should handle install failure gracefully', async () => {
    mockPromptInstall.mockRejectedValue(new Error('Install failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<PWAInstallPrompt />)
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Install App'))
    
    await waitFor(() => {
      expect(mockPromptInstall).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Error installing PWA:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('should handle dismiss button click', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} />)
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText('Not Now')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Not Now'))
    
    expect(mockOnDismiss).toHaveBeenCalled()
    
    // Should not render after dismissal
    expect(screen.queryByText('Install Pourtrait')).not.toBeInTheDocument()
  })

  it('should handle close button click', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} />)
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByLabelText('Dismiss install prompt')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByLabelText('Dismiss install prompt'))
    
    expect(mockOnDismiss).toHaveBeenCalled()
  })
})

describe('PWAInstallButton', () => {
  const mockPromptInstall = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUsePWA.mockReturnValue({
      canInstall: true,
      isStandalone: false,
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })
  })

  it('should render when installable', () => {
    render(<PWAInstallButton />)
    
    expect(screen.getByText('Install App')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should not render when cannot install', () => {
    mockUsePWA.mockReturnValue({
      canInstall: false,
      isStandalone: false,
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })

    render(<PWAInstallButton />)
    
    expect(screen.queryByText('Install App')).not.toBeInTheDocument()
  })

  it('should not render when already standalone', () => {
    mockUsePWA.mockReturnValue({
      canInstall: true,
      isStandalone: true,
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installPrompt: null,
      promptInstall: mockPromptInstall,
      requestNotificationPermission: vi.fn(),
      showNotification: vi.fn(),
      registerForPushNotifications: vi.fn(),
    })

    render(<PWAInstallButton />)
    
    expect(screen.queryByText('Install App')).not.toBeInTheDocument()
  })

  it('should handle install button click', async () => {
    mockPromptInstall.mockResolvedValue(true)
    
    render(<PWAInstallButton />)
    
    fireEvent.click(screen.getByText('Install App'))
    
    await waitFor(() => {
      expect(mockPromptInstall).toHaveBeenCalled()
    })
  })

  it('should handle install error gracefully', async () => {
    mockPromptInstall.mockRejectedValue(new Error('Install failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<PWAInstallButton />)
    
    fireEvent.click(screen.getByText('Install App'))
    
    await waitFor(() => {
      expect(mockPromptInstall).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Error installing PWA:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})