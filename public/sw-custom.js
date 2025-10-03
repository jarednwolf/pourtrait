/**
 * Custom Service Worker for Pourtrait PWA
 * 
 * Extends the generated Workbox service worker with push notification handling
 */

// Import the generated Workbox service worker
importScripts('./sw.js')

// Add push notification event handlers
self.addEventListener('push', function(event) {
  console.log('Push event received:', event)

  if (!event.data) {
    console.log('Push event has no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('Push notification data:', data)

    const options = {
      body: data.body || 'New notification from Pourtrait',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      image: data.image,
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Pourtrait', options)
    )

    // Log the notification display
    logNotificationEvent('displayed', data)

  } catch (error) {
    console.error('Error processing push event:', error)
    
    // Show a fallback notification
    event.waitUntil(
      self.registration.showNotification('Pourtrait', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'fallback'
      })
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  // Handle different actions
  if (action === 'view' || !action) {
    // Default action or "view" action - open the app
    event.waitUntil(
      handleNotificationClick(data)
    )
  } else if (action === 'dismiss') {
    // Dismiss action - just close (already done above)
    console.log('Notification dismissed')
  } else {
    // Handle custom actions
    console.log('Custom action clicked:', action)
    event.waitUntil(
      handleCustomAction(action, data)
    )
  }

  // Log the interaction
  logNotificationEvent('clicked', { action, data })
})

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event)
  
  const data = event.notification.data || {}
  logNotificationEvent('closed', { data })
})

// Handle notification click - open appropriate page
async function handleNotificationClick(data) {
  try {
    const urlToOpen = getUrlForNotification(data)
    
    // Check if any window is already open
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // If a window is already open, focus it and navigate
    if (windowClients.length > 0) {
      const client = windowClients[0]
      await client.focus()
      
      // Navigate to the appropriate page if possible
      if (client.navigate && urlToOpen !== client.url) {
        await client.navigate(urlToOpen)
      }
    } else {
      // Open a new window
      await clients.openWindow(urlToOpen)
    }
  } catch (error) {
    console.error('Error handling notification click:', error)
    
    // Fallback - just open the main app
    try {
      await clients.openWindow('/')
    } catch (fallbackError) {
      console.error('Error opening fallback window:', fallbackError)
    }
  }
}

// Handle custom notification actions
async function handleCustomAction(action, data) {
  switch (action) {
    case 'mark_read':
      await markNotificationAsRead(data.notificationId)
      break
    
    case 'view_wine':
      const wineUrl = `/inventory/${data.wineId}`
      await clients.openWindow(wineUrl)
      break
    
    case 'view_recommendations':
      await clients.openWindow('/recommendations')
      break
    
    case 'snooze':
      await snoozeNotification(data)
      break
    
    default:
      console.log('Unknown action:', action)
  }
}

// Get appropriate URL for notification type
function getUrlForNotification(data) {
  const baseUrl = self.location.origin
  
  switch (data.type) {
    case 'drinking_window':
      if (data.wineId) {
        return `${baseUrl}/inventory/${data.wineId}`
      }
      return `${baseUrl}/inventory`
    
    case 'recommendations':
      return `${baseUrl}/recommendations`
    
    case 'inventory_reminder':
      return `${baseUrl}/inventory`
    
    case 'system':
      return `${baseUrl}/settings`
    
    default:
      return baseUrl
  }
}

// Log notification events for analytics
async function logNotificationEvent(eventType, data) {
  try {
    await fetch('/api/analytics/notification-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        timestamp: Date.now(),
        data
      })
    })
  } catch (error) {
    console.error('Error logging notification event:', error)
  }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  if (!notificationId) return
  
  try {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST'
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

// Snooze notification
async function snoozeNotification(data) {
  try {
    await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
        snoozeMinutes: 60
      })
    })
    
    await self.registration.showNotification('Notification Snoozed', {
      body: 'You will be reminded again in 1 hour',
      icon: '/icons/icon-192x192.png',
      tag: 'snooze-confirmation',
      requireInteraction: false
    })
  } catch (error) {
    console.error('Error snoozing notification:', error)
  }
}

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('Service worker received message:', event.data)
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' })
      break
    
    case 'TEST_NOTIFICATION':
      self.registration.showNotification('Test Notification', {
        body: 'This is a test notification from the service worker',
        icon: '/icons/icon-192x192.png',
        tag: 'test'
      })
      break
    
    default:
      console.log('Unknown message type:', event.data.type)
  }
})