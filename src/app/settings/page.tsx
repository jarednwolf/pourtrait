'use client'

import { useEffect, useState } from 'react'
import { DataExportPanel } from '@/components/settings/DataExportPanel'
import { Card } from '@/components/ui/Card'
import { ProfileSettingsPanel } from '@/components/settings/ProfileSettingsPanel'
import { Button } from '@/components/ui/Button'
import { usePushNotifications, useNotificationPreferences } from '@/hooks/usePushNotifications'
import { track } from '@/lib/utils/track'

type SettingsTab = 'profile' | 'notifications' | 'data' | 'privacy'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  useEffect(() => {
    if (typeof window === 'undefined') {return}
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') as SettingsTab | null
    if (tab && ['profile', 'notifications', 'data', 'privacy'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  const tabs = [
    { id: 'profile' as const, label: 'Profile', description: 'Manage your account and preferences' },
    { id: 'notifications' as const, label: 'Notifications', description: 'Configure alerts and reminders' },
    { id: 'data' as const, label: 'Data & Export', description: 'Export, backup, and manage your data' },
    { id: 'privacy' as const, label: 'Privacy', description: 'Privacy settings and data control' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account, preferences, and data</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-wine-100 text-wine-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-sm text-gray-500">{tab.description}</div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <ProfileSettingsPanel />}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                <NotificationsSettingsStub />
              </Card>
            )}

            {activeTab === 'data' && <DataExportPanel />}

            {activeTab === 'privacy' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
                <p className="text-gray-600">Privacy controls coming soon.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsSettingsStub() {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe, requestPermission, loading, error } = usePushNotifications()
  const { preferences, updatePreference } = useNotificationPreferences()
  const enabled = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true' : false

  const handleSubscribe = async () => {
    track('notifications_settings_subscribe_clicked')
    const ok = await subscribe()
    if (!ok) {
      await requestPermission()
    }
  }

  const handleUnsubscribe = async () => {
    track('notifications_settings_unsubscribe_clicked')
    await unsubscribe()
  }

  return (
    <div className="space-y-4">
      {!enabled && (
        <div className="p-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
          Notifications are disabled in this environment.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-medium text-gray-900">Push Notifications</div>
          <div className="text-sm text-gray-600">Status: {isSupported ? 'Supported' : 'Not supported'} • Permission: {permission}</div>
          <div className="mt-2 flex gap-2">
            {!isSubscribed ? (
              <Button size="sm" onClick={handleSubscribe} disabled={!enabled || loading} aria-label="Enable push notifications">
                Enable
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleUnsubscribe} disabled={loading} aria-label="Disable push notifications">
                Disable
              </Button>
            )}
            {permission === 'default' && (
              <Button size="sm" variant="outline" onClick={requestPermission} disabled={!enabled || loading} aria-label="Request permission">
                Request permission
              </Button>
            )}
          </div>
          {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
        </div>

        <div>
          <div className="font-medium text-gray-900">Alert Types</div>
          <div className="mt-2 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={preferences.drinkingWindowAlerts} onChange={(e) => updatePreference('drinkingWindowAlerts', e.target.checked)} />
              Ready-to-drink alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={preferences.recommendationAlerts} onChange={(e) => updatePreference('recommendationAlerts', e.target.checked)} />
              New recommendation alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={preferences.inventoryReminders} onChange={(e) => updatePreference('inventoryReminders', e.target.checked)} />
              Inventory reminders
            </label>
          </div>
        </div>
      </div>
    </div>
  )}
