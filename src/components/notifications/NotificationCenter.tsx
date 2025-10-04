'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useDrinkingWindowNotifications } from '@/hooks/useDrinkingWindowNotifications'
import { NotificationScheduler } from '@/lib/services/notification-scheduler'
import { useAuth } from '@/hooks/useAuth'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  createdAt: string
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const { notifications, loading, markAsRead } = useDrinkingWindowNotifications(user?.id || '')
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'settings'>('current')
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])
  const [deliveryStats, setDeliveryStats] = useState<any>(null)

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotificationHistory()
      loadDeliveryStats()
    }
  }, [isOpen, user?.id])

  const loadNotificationHistory = async () => {
    if (!user?.id) return
    
    try {
      const { notifications: history } = await NotificationScheduler.getNotificationHistory(user.id, 20)
      setNotificationHistory(history)
    } catch (error) {
      console.error('Failed to load notification history:', error)
    }
  }

  const loadDeliveryStats = async () => {
    if (!user?.id) return
    
    try {
      const stats = await NotificationScheduler.getDeliveryStats(user.id)
      setDeliveryStats(stats)
    } catch (error) {
      console.error('Failed to load delivery stats:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'drinking_window':
        return <Icon name="exclamation-triangle" className="h-4 w-4 text-amber-500" />
      case 'recommendation':
        return <Icon name="bell" className="h-4 w-4 text-blue-500" />
      case 'system':
        return <Icon name="settings" className="h-4 w-4 text-gray-500" />
      default:
        return <Icon name="bell" className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      sent: { color: 'bg-green-100 text-green-800', label: 'Sent' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Icon name="bell" className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notification Center</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="x" className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Current ({notifications.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {/* Current Notifications Tab */}
          {activeTab === 'current' && (
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="bell" className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate((notification as any).created_at || (notification as any).createdAt)}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Icon name="check" className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-4">
              {deliveryStats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{deliveryStats.total}</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{deliveryStats.sent}</div>
                      <div className="text-gray-500">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{deliveryStats.failed}</div>
                      <div className="text-gray-500">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{deliveryStats.pending}</div>
                      <div className="text-gray-500">Pending</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{deliveryStats.cancelled}</div>
                      <div className="text-gray-500">Cancelled</div>
                    </div>
                  </div>
                </div>
              )}

              {notificationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="clock" className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notification history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className="p-4 rounded-lg border bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {JSON.parse(notification.payload).title}
                              </h4>
                              {getStatusBadge(notification.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {JSON.parse(notification.payload).body}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span>Scheduled: {formatDate(notification.scheduled_for)}</span>
                              {notification.last_attempt && (
                                <span>Last attempt: {formatDate(notification.last_attempt)}</span>
                              )}
                              <span>Attempts: {notification.attempts}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-4">
              <NotificationSettings />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function NotificationSettings() {
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
      drinkingWindow: 'immediate',
      recommendations: 'daily',
      inventory: 'weekly'
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [user?.id])

  const loadPreferences = async () => {
    // This would load from the user's profile
    // For now, we'll use default values
  }

  const savePreferences = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // This would save to the user's profile
      console.log('Saving preferences:', preferences)
      // await updateUserPreferences(user.id, preferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.drinkingWindowAlerts}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                drinkingWindowAlerts: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Drinking window alerts</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.recommendationAlerts}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                recommendationAlerts: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Wine recommendations</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.inventoryReminders}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                inventoryReminders: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Inventory reminders</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.systemAlerts}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                systemAlerts: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">System alerts</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Delivery Methods</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                pushEnabled: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Push notifications</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                emailEnabled: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Email notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Quiet Hours</h3>
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={preferences.quietHours.enabled}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              quietHours: { ...prev.quietHours, enabled: e.target.checked }
            }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Enable quiet hours</span>
        </label>
        {preferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, start: e.target.value }
                }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, end: e.target.value }
                }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Notification Frequency</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drinking window alerts
            </label>
            <select
              value={preferences.frequency.drinkingWindow}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                frequency: { ...prev.frequency, drinkingWindow: e.target.value as any }
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations
            </label>
            <select
              value={preferences.frequency.recommendations}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                frequency: { ...prev.frequency, recommendations: e.target.value as any }
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventory reminders
            </label>
            <select
              value={preferences.frequency.inventory}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                frequency: { ...prev.frequency, inventory: e.target.value as any }
              }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button onClick={savePreferences} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}