import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { track } from '@/lib/utils/track'
import { SommChatPanel } from '@/components/dashboard/SommChatPanel'
import { MyCellarPanel } from '@/components/dashboard/MyCellarPanel'
import { YourPourtraitPanel } from '@/components/dashboard/YourPourtraitPanel'
import { PrimaryActionRow } from '@/components/dashboard/PrimaryActionRow'
import { WhatsNewTip } from '@/components/dashboard/WhatsNewTip'
import { DashboardHeaderInfo } from '@/components/dashboard/DashboardHeaderInfo'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-6">
        <DashboardHeaderInfo />
        <div className="mt-4">
          <PrimaryActionRow />
        </div>
        <div className="mt-2">
          <WhatsNewTip />
        </div>
        {/* Analytics: dashboard viewed */}
        {/* Fire analytics without rendering junk nodes */}
        {typeof window !== 'undefined' ? (track('dashboard_viewed'), null) : null}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch" aria-label="Dashboard panels">
          <div className="md:col-span-6 lg:col-span-4">
            <SommChatPanel />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <MyCellarPanel />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <YourPourtraitPanel />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


