'use client'

import { useEffect, useState } from 'react'
import { DataExportPanel } from '@/components/settings/DataExportPanel'
import { Card } from '@/components/ui/Card'

type SettingsTab = 'profile' | 'notifications' | 'data' | 'privacy'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('data')

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
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                <p className="text-gray-600">Profile management features coming soon.</p>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                <p className="text-gray-600">Notification preferences coming soon.</p>
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