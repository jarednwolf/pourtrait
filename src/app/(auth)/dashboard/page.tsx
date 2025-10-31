import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'
import { AlertsPanel as AlertsPanelComponent } from '@/components/dashboard/AlertsPanel'
import { SommelierPreview as SommelierPreviewComponent } from '@/components/dashboard/SommelierPreview'
import { ExplorationPanel as ExplorationPanelComponent } from '@/components/dashboard/ExplorationPanel'
import { TasteProfilePanel } from '@/components/dashboard/TasteProfilePanel'
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
          <Card className="h-full md:col-span-6 lg:col-span-3">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center text-heading-3">
                <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Tonight’s Pick
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-sm text-gray-700">Your personal pick for tonight.</div>
              <div className="mt-3">
                <Button asChild size="sm" className="min-w-[128px]"><a href="/chat?q=What%20should%20I%20drink%20tonight%3F&send=1" aria-label="See tonight's pick">See tonight’s pick</a></Button>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-6 lg:col-span-3">
            <TasteProfilePanel />
          </div>

          <Card className="h-full md:col-span-6 lg:col-span-3">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center text-heading-3">
                <Icon name="grid" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                My Cellar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-sm text-gray-700">No bottles yet — add your first bottle to get alerts.</div>
              <div className="mt-3 flex items-center gap-3">
                <Button asChild size="sm" className="min-w-[128px]"><a href="/inventory?action=add" aria-label="Add your first bottle">Add first bottle</a></Button>
                <a href="/import" className="text-primary whitespace-nowrap inline-block" aria-label="Import from CSV">Import CSV</a>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-6 lg:col-span-3">
            <SommelierPreviewComponent />
          </div>

          <div className="md:col-span-6 lg:col-span-3">
            <AlertsPanelComponent />
          </div>

          <div className="md:col-span-6 lg:col-span-3">
            <ExplorationPanelComponent />
          </div>

          <Card className="h-full md:col-span-6 lg:col-span-3">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center text-heading-3">
                <Icon name="user" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Profile insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-sm text-gray-700">See your palate balance and style levers.</div>
              <div className="mt-3">
                <Button asChild size="sm" className="min-w-[128px]"><a href="/profile" aria-label="See your insights">See insights</a></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}


