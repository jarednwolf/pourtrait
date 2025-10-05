/**
 * PWA Hook Tests
 * 
 * Tests for PWA functionality including installation prompts,
 * offline status, and push notifications.
 */

import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { usePWA } from '../usePWA'

// Mock browser APIs
const mockBeforeInstallPromptEvent = {
  preventDefault: vi.fn(),
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  platforms: ['web'],
}

const mockNotification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'default' as NotificationPermission,
}

const mockServiceWorker = {
  ready: Promise.resolve({
    pushManager: {
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://example.com/push',
        getKey: vi.fn().mockReturnValue(new ArrayBuffer(8)),
      }),
      getSubscription: vi.fn().mockResolvedValue(null),
    },
  }),
}

// Setup global mocks
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    serviceWorker: mockServiceWorker,
  },
  writable: true,
})

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
})

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    })
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePWA())

      expect(result.current.isInstallable).toBe(false)
      expect(result.current.isInstalled).toBe(false)
      expect(result.current.isOnline).toBe(true)
      expect(result.current.isStandalone).toBe(false)
      expect(result.current.canInstall).toBe(false)
      expect(result.current.installPrompt).toBe(null)
    })

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      })

      const { result } = renderHook(() => usePWA())
      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('install prompt handling', () => {
    it('should handle beforeinstallprompt event', () => {
      const { result } = renderHook(() => usePWA())

      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
      })

      expect(result.current.isInstallable).toBe(true)
      expect(result.current.canInstall).toBe(true)
      expect(result.current.installPrompt).toBeTruthy()
    })

    it('should handle app installed event', () => {
      const { result } = renderHook(() => usePWA())

      // First trigger install prompt
      act(() => {
        const beforeInstallEvent = new Event('beforeinstallprompt')
        Object.assign(beforeInstallEvent, mockBeforeInstallPromptEvent)
        window.dispatchEvent(beforeInstallEvent)
      })

      expect(result.current.isInstallable).toBe(true)

      // Then trigger app installed
      act(() => {
        const installedEvent = new Event('appinstalled')
        window.dispatchEvent(installedEvent)
      })

      expect(result.current.isInstalled).toBe(true)
      expect(result.current.isInstallable).toBe(false)
      expect(result.current.canInstall).toBe(false)
      expect(result.current.installPrompt).toBe(null)
    })
  })

  describe('promptInstall', () => {
    it('should prompt installation when install prompt is available', async () => {
      const { result } = renderHook(() => usePWA())

      // Set up install prompt
      act(() => {
        const event = new Event('beforeinstallprompt')
        Object.assign(event, mockBeforeInstallPromptEvent)
        window.dispatchEvent(event)
      })

      const installResult = await act(async () => {
        return await result.current.promptInstall()
      })

      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled()
      expect(installResult).toBe(true)
    })

    it('should return false when no install prompt is available', async () => {
      const { result } = renderHook(() => usePWA())

      const installResult = await act(async () => {
        return await result.current.promptInstall()
      })

      expect(installResult).toBe(false)
    })
  })

  describe('notification permissions', () => {
    it('should request notification permission', async () => {
      const { result } = renderHook(() => usePWA())

      const permission = await act(async () => {
        return await result.current.requestNotificationPermission()
      })

      expect(mockNotification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return existing permission if already granted', async () => {
      mockNotification.permission = 'granted'
      const { result } = renderHook(() => usePWA())

      const permission = await act(async () => {
        return await result.current.requestNotificationPermission()
      })

      expect(permission).toBe('granted')
    })

    it('should return denied if permission is denied', async () => {
      mockNotification.permission = 'denied'
      const { result } = renderHook(() => usePWA())

      const permission = await act(async () => {
        return await result.current.requestNotificationPermission()
      })

      expect(permission).toBe('denied')
    })
  })

  describe('push notification registration', () => {
    it('should register for push notifications', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key'
      mockNotification.permission = 'granted'
      
      const { result } = renderHook(() => usePWA())

      const subscription = await act(async () => {
        return await result.current.registerForPushNotifications()
      })

      expect(subscription).toBeTruthy()
      expect(JSON.parse(subscription!)).toHaveProperty('endpoint')
    })

    it('should return null if push notifications not supported', async () => {
      // Mock unsupported environment: remove serviceWorker capability
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true },
        writable: true,
      })

      const { result } = renderHook(() => usePWA())

      const subscription = await act(async () => {
        return await result.current.registerForPushNotifications()
      })

      expect(subscription).toBeNull()
    })
  })

  describe('network status changes', () => {
    it('should update online status when network changes', () => {
      const { result } = renderHook(() => usePWA())

      expect(result.current.isOnline).toBe(true)

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          writable: true,
        })
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current.isOnline).toBe(false)

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          value: true,
          writable: true,
        })
        window.dispatchEvent(new Event('online'))
      })

      expect(result.current.isOnline).toBe(true)
    })
  })

  describe('showNotification', () => {
    it('should show notification when permission is granted', () => {
      mockNotification.permission = 'granted'
      const mockNotificationConstructor = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(mockNotificationConstructor, { permission: 'granted' }),
        writable: true,
      })

      const { result } = renderHook(() => usePWA())

      act(() => {
        result.current.showNotification('Test Title', { body: 'Test Body' })
      })

      expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Title', {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        body: 'Test Body',
      })
    })

    it('should not show notification when permission is denied', () => {
      mockNotification.permission = 'denied'
      const mockNotificationConstructor = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: mockNotificationConstructor,
        writable: true,
      })

      const { result } = renderHook(() => usePWA())

      act(() => {
        result.current.showNotification('Test Title', { body: 'Test Body' })
      })

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })
})