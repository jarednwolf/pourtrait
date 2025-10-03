'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NotificationCenter } from './NotificationCenter'
import { useDrinkingWindowNotifications } from '@/lib/services/notification-service'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/hooks/useAuth'

export function NotificationBell() {
  const { user } = useAuth()
  const { notifications, loading } = useDrinkingWindowNotifications(user?.id || '')
  const { isSubscribed, subscribe, canSubscribe } = usePushNotifications()
  const [showCenter, setShowCenter] = useState(false)
  const [showPushPrompt, setShowPushPrompt] = useState(false)

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  // Show push notification prompt if user can subscribe but hasn't
  useEffect(() => {
    if (canSubscribe && !isSubscribed && user) {
      // Show prompt after a delay to not be intrusive
      const timer = setTimeout(() => {
        setShowPushPrompt(true)
      }, 5000) // 5 seconds after component mounts

      return () => clearTimeout(timer)
    }
  }, [canSubscribe, isSubscribed, user])

  const handleBellClick = () => {
    setShowCenter(true)
  }

  const handleEnablePushNotifications = async () => {
    const success = await subscribe()
    if (success) {
      setShowPushPrompt(false)
    }
  }

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pushPromptDismissed', 'true')
  }

  // Don't show push prompt if dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pushPromptDismissed')
    if (dismissed) {
      setShowPushPrompt(false)
    }
  }, [])

  if (!user) return null

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBellClick}
          className="relative p-2"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-amber-600" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Push notification prompt */}
        {showPushPrompt && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
            <div className="flex items-start space-x-3">
              <BellRing className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  Enable Push Notifications
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when your wines are ready to drink or when you have new recommendations.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleEnablePushNotifications}
                    className="text-xs"
                  >
                    Enable
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismissPushPrompt}
                    className="text-xs"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showCenter}
        onClose={() => setShowCenter(false)}
      />
    </>
  )
}