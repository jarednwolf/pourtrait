import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-display-2 sm:text-display-1">Welcome back</h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <Card className="h-full">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center text-base">
                <Icon name="sparkles" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Tonight’s Pick
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-gray-700">We’ll recommend a bottle you’ll love.</div>
              <div className="mt-3">
                <Button asChild size="sm"><a href="/chat?q=What%20should%20I%20drink%20tonight%3F&send=1">Ask now</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center text-base">
                <Icon name="grid" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Your Cellar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-gray-700">Quick view of bottles and recent additions.</div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline"><a href="/inventory">View inventory</a></Button>
                <Button asChild size="sm"><a href="/import">Import CSV</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center text-base">
                <Icon name="list" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Finish your taste profile quiz</li>
                <li>Enable notifications for drink‑now reminders</li>
                <li>Add 3 bottles to your cellar</li>
              </ul>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline"><a href="/onboarding/step1">Start quiz</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center text-base">
                <Icon name="bell" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-gray-700">Get notified when bottles hit their peak.</div>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline"><a href="/settings?tab=notifications">Enable notifications</a></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}


