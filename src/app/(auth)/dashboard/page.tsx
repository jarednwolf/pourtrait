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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-heading-1">Welcome back</h1>
        {/* Analytics: dashboard viewed */}
        {/* Fire analytics without rendering junk nodes */}
        {typeof window !== 'undefined' ? (track('dashboard_viewed'), null) : null}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch" aria-label="Dashboard panels">
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
                <Button asChild size="sm"><a href="/chat?q=What%20should%20I%20drink%20tonight%3F&send=1">Ask now</a></Button>
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
              <div className="text-sm text-gray-700">0 bottles • 0 ready to drink</div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline"><a href="/inventory">View inventory</a></Button>
                <Button asChild size="sm"><a href="/import">Import CSV</a></Button>
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
                <Button asChild size="sm"><a href="/profile">View</a></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}


