/**
 * Onboarding Complete Component
 * 
 * Final step of onboarding that celebrates completion and provides
 * next steps for the user.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/design-system/utils'

interface OnboardingCompleteProps {
  result: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    confidenceScore: number
    educationalRecommendations: string[]
  }
  onComplete: () => void
  className?: string
}

export function OnboardingComplete({
  result,
  onComplete,
  className
}: OnboardingCompleteProps) {
  const experienceLevelLabels = {
    beginner: 'New to Wine',
    intermediate: 'Wine Enthusiast', 
    advanced: 'Wine Connoisseur'
  }

  const experienceLevelColors = {
    beginner: 'success',
    intermediate: 'primary',
    advanced: 'wine'
  } as const

  const confidencePercentage = Math.round(result.confidenceScore * 100)

  const nextSteps = [
    {
      icon: 'plus',
      title: 'Add Your First Wine',
      description: 'Start building your wine inventory by adding bottles you own',
      action: 'Add Wine'
    },
    {
      icon: 'camera',
      title: 'Scan Wine Labels',
      description: 'Use your camera to quickly add wines by scanning their labels',
      action: 'Try Scanner'
    },
    {
      icon: 'heart',
      title: 'Get Recommendations',
      description: 'Ask our AI sommelier what you should drink tonight',
      action: 'Get Recommendations'
    }
  ]

  return (
    <div className={cn('max-w-3xl mx-auto space-y-8', className)}>
      {/* Success Header */}
      <Card className="text-center bg-green-50 border-green-200">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="success" size="lg" className="text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-900">
            Profile Complete!
          </CardTitle>
          <CardDescription className="text-lg mt-2 text-green-800">
            Your personalized wine profile is ready. We're excited to help you 
            discover wines you'll love.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="user" size="sm" className="mr-2" />
              Your Wine Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Badge 
              variant={experienceLevelColors[result.experienceLevel]}
              className="text-lg px-4 py-2"
            >
              {experienceLevelLabels[result.experienceLevel]}
            </Badge>
            <p className="text-gray-600">
              We've customized the experience to match your wine knowledge level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="star" size="sm" className="mr-2" />
              Profile Strength
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-3xl font-bold text-burgundy-600">
              {confidencePercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-burgundy-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${confidencePercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Your profile will get stronger as you rate wines and provide feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="arrow-right" size="sm" className="mr-2" />
            What's Next?
          </CardTitle>
          <CardDescription>
            Here are some great ways to get started with Pourtrait
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <NextStepCard
                key={index}
                icon={step.icon}
                title={step.title}
                description={step.description}
                action={step.action}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Tips */}
      {result.educationalRecommendations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Icon name="info" size="sm" className="mr-2" />
              Personalized Tips for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.educationalRecommendations.slice(0, 3).map((tip, index) => (
                <div key={index} className="flex items-start">
                  <Icon name="arrow-right" size="sm" className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-blue-800">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <div className="text-center space-y-4">
        <Button
          onClick={onComplete}
          size="lg"
          className="flex items-center mx-auto"
        >
          <Icon name="arrow-right" size="sm" className="mr-2" />
          Start Exploring Wines
        </Button>
        <p className="text-sm text-gray-500">
          You can always update your preferences in your profile settings
        </p>
      </div>

      {/* Encouragement */}
      <Card className="bg-burgundy-50 border-burgundy-200 text-center">
        <CardContent className="pt-6">
          <p className="text-burgundy-800 font-medium">
            "The best wine is the one you enjoy. We're here to help you discover more wines you'll love."
          </p>
          <p className="text-burgundy-600 text-sm mt-2">
            — Your AI Sommelier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Next Step Card Component
 */
function NextStepCard({
  icon,
  title,
  description,
  action
}: {
  icon: string
  title: string
  description: string
  action: string
}) {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-burgundy-300 hover:bg-burgundy-50 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 mr-4">
        <Icon name={icon as any} size="sm" className="text-burgundy-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      </div>
      <Button variant="outline" size="sm" className="ml-4">
        {action}
      </Button>
    </div>
  )
}