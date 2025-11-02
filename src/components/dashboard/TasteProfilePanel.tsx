"use client"
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useUserProfile } from '@/hooks/useAuth'

export function TasteProfilePanel() {
  const { profile, loading, isAuthenticated } = useUserProfile()

  return (
    <Card className="h-full" role="region" aria-labelledby="taste-profile-heading">
      <CardHeader className="p-5">
        <CardTitle id="taste-profile-heading" className="flex items-center text-heading-3">
          <Icon name="heart" className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
          Taste Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {loading ? (
          <div className="text-sm text-gray-700">Loading your profile…</div>
        ) : profile ? (
          <div className="text-sm text-gray-700">
            Your profile is set. Chat the sommelier to get personalized picks.
            <div className="mt-3">
              <Button asChild size="sm"><a href="/chat">Open chat</a></Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            {isAuthenticated ? 'Complete your taste profile to unlock personalized recommendations.' : 'Create an account to save your taste profile.'}
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm"><a href="/onboarding/step1">Start profile</a></Button>
              <Button asChild size="sm" variant="outline"><a href="/onboarding/preview">Preview</a></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


