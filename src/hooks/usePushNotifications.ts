'use client'

import { useState, useEffect, useCallback } from 'react'
import { pushNotificationService } from '@/lib/services/push-notifications'
import { useAuth } from './useAuth'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  subscription: PushSubscription | null
  loading: boolean
  error: string | null
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    loading: true,
    error: null
  })

  // Initialize push notification state
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const isSupported = pushNotificationService.isSupported()
        const permission = pushNotificationService.getPermissionStatus()
        
        let subscription: PushSubscription | null = null
        let isSubscribed = false

        if (isSupported && permission === 'granted') {
          subscription = await pushNotificationService.getSubscription()
          isSubscribed = subscription !== null
        }

        setState({
          isSupported,
          permission,
          isSubscribed,
          subscription,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error initializing push notifications:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize push notifications'
        }))
      }
    }

    initializePushNotifications()
  }, [])

  // Request permission and subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications are not supported' }))
      return false
    }

    if (!user) {
      setState(prev => ({ ...prev, error: 'User must be logged in to subscribe' }))
      return false
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const subscriptionData = await pushNotificationService.subscribe()
      
      if (subscriptionData) {
        const subscription = await pushNotificationService.getSubscription()
        setState(prev => ({
          ...prev,
          permission: 'granted',
          isSubscribed: true,
          subscription,
          loading: false
        }))
        return true
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to subscribe to push notifications'
        }))
        return false
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe'
      }))
      return false
    }
  }, [state.isSupported, user])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const success = await pushNotificationService.unsubscribe()
      
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null,
          loading: false
        }))
        return true
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to unsubscribe from push notifications'
        }))
        return false
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe'
      }))
      return false
    }
  }, [])

  // Show a local notification (for testing or immediate notifications)
  const showNotification = useCallback(async (
    title: string,
    options?: {
      body?: string
      icon?: string
      badge?: string
      image?: string
      tag?: string
      data?: any
      actions?: Array<{ action: string; title: string; icon?: string }>
      requireInteraction?: boolean
    }
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Push notifications are not supported')
    }

    if (state.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      await pushNotificationService.showNotification({
        title,
        body: options?.body || '',
        icon: options?.icon,
        badge: options?.badge,
        image: options?.image,
        tag: options?.tag,
        data: options?.data,
        actions: options?.actions,
        requireInteraction: options?.requireInteraction
      })
    } catch (error) {
      console.error('Error showing notification:', error)
      throw error
    }
  }, [state.isSupported, state.permission])

  // Request permission only (without subscribing)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      return 'denied'
    }

    try {
      const permission = await pushNotificationService.requestPermission()
      setState(prev => ({ ...prev, permission }))
      return permission
    } catch (error) {
      console.error('Error requesting permission:', error)
      return 'denied'
    }
  }, [state.isSupported])

  // Check if notifications are enabled in user preferences
  const checkNotificationPreferences = useCallback(async (): Promise<boolean> => {
    if (!user) {return false}

    try {
      // This would check the user's notification preferences from their profile
      // For now, we'll assume they're enabled if they're subscribed
      return state.isSubscribed
    } catch (error) {
      console.error('Error checking notification preferences:', error)
      return false
    }
  }, [user, state.isSubscribed])

  // Test notification functionality
  const testNotification = useCallback(async (): Promise<void> => {
    if (!state.isSubscribed) {
      throw new Error('Not subscribed to push notifications')
    }

    try {
      await showNotification('Test Notification', {
        body: 'This is a test notification from Pourtrait',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification',
        data: { type: 'test' },
        actions: [
          { action: 'view', title: 'View App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
      throw error
    }
  }, [state.isSubscribed, showNotification])

  return {
    // State
    isSupported: state.isSupported,
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    subscription: state.subscription,
    loading: state.loading,
    error: state.error,

    // Actions
    subscribe,
    unsubscribe,
    requestPermission,
    showNotification,
    testNotification,
    checkNotificationPreferences,

    // Computed values
    canSubscribe: state.isSupported && !state.isSubscribed && state.permission !== 'denied',
    needsPermission: state.isSupported && state.permission === 'default',
    isBlocked: state.permission === 'denied'
  }
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: true,
    drinkingWindowAlerts: true,
    recommendationAlerts: true,
    inventoryReminders: true,
    systemAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: {
      drinkingWindow: 'immediate' as const,
      recommendations: 'daily' as const,
      inventory: 'weekly' as const
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load preferences from user profile
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {return}

      try {
        setLoading(true)
        setError(null)

        // This would load from the user's profile in the database
        // For now, we'll use default values
        console.log('Loading notification preferences for user:', user.id)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading notification preferences:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preferences')
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user?.id])

  // Save preferences to user profile
  const savePreferences = useCallback(async (newPreferences: typeof preferences): Promise<boolean> => {
    if (!user?.id) {return false}

    try {
      setLoading(true)
      setError(null)

      // This would save to the user's profile in the database
      console.log('Saving notification preferences:', newPreferences)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPreferences(newPreferences)
      setLoading(false)
      return true
    } catch (err) {
      console.error('Error saving notification preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      setLoading(false)
      return false
    }
  }, [user?.id])

  // Update specific preference
  const updatePreference = useCallback(async (
    key: keyof typeof preferences,
    value: any
  ): Promise<boolean> => {
    const newPreferences = { ...preferences, [key]: value }
    return await savePreferences(newPreferences)
  }, [preferences, savePreferences])

  return {
    preferences,
    loading,
    error,
    savePreferences,
    updatePreference,
    setPreferences
  }
}