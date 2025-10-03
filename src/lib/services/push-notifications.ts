/**
 * Push Notification Service
 * 
 * Handles push notification registration, subscription management,
 * and notification delivery for PWA capabilities.
 */

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
}

class PushNotificationService {
  private vapidPublicKey: string | null = null
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    this.initializeServiceWorker()
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready
      console.log('Service Worker ready for push notifications')
    } catch (error) {
      console.error('Error initializing service worker:', error)
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  // Get current notification permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied'
    return Notification.permission
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported() || !this.vapidPublicKey) {
      console.warn('Push notifications not supported or VAPID key missing')
      return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return null
    }

    try {
      if (!this.serviceWorkerRegistration) {
        await this.initializeServiceWorker()
      }

      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not available')
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      }

      // Send subscription to your backend
      await this.sendSubscriptionToServer(subscriptionData)

      return subscriptionData
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      if (subscription) {
        const success = await subscription.unsubscribe()
        if (success) {
          // Notify your backend about the unsubscription
          await this.removeSubscriptionFromServer(subscription.endpoint)
        }
        return success
      }
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null
    }

    try {
      return await this.serviceWorkerRegistration.pushManager.getSubscription()
    } catch (error) {
      console.error('Error getting push subscription:', error)
      return null
    }
  }

  // Show local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
          image: payload.image,
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction,
        })
      }
      return
    }

    try {
      await this.serviceWorkerRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction,
        vibrate: [200, 100, 200],
      })
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  // Send subscription to your backend
  private async sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error)
      throw error
    }
  }

  // Remove subscription from your backend
  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error)
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

export const pushNotificationService = new PushNotificationService()

// Predefined notification templates for wine-related alerts
export const wineNotificationTemplates = {
  drinkingWindow: (wineName: string, status: string) => ({
    title: 'Wine Ready to Drink',
    body: `${wineName} is ${status}. Consider enjoying it soon!`,
    icon: '/icons/wine-glass.png',
    tag: 'drinking-window',
    data: { type: 'drinking-window', wineName, status },
    actions: [
      {
        action: 'view',
        title: 'View Wine',
        icon: '/icons/view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png',
      },
    ],
  }),

  newRecommendation: (count: number) => ({
    title: 'New Wine Recommendations',
    body: `We have ${count} new wine recommendations for you!`,
    icon: '/icons/recommendations.png',
    tag: 'recommendations',
    data: { type: 'recommendations', count },
    actions: [
      {
        action: 'view',
        title: 'View Recommendations',
        icon: '/icons/view.png',
      },
    ],
  }),

  inventoryReminder: () => ({
    title: 'Update Your Wine Inventory',
    body: "It's been a while since you've updated your wine collection. Add any new wines?",
    icon: '/icons/inventory.png',
    tag: 'inventory-reminder',
    data: { type: 'inventory-reminder' },
  }),
}