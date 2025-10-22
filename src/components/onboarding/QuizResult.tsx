/**
 * Quiz Result Component
 * 
 * Displays the calculated taste profile results with educational
 * explanations and next steps for the user.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { educationalContent } from '@/lib/onboarding/quiz-data'
import { PalatePortrait } from './PalatePortrait'
import { cn } from '@/lib/design-system/utils'

interface QuizResultProps {
  result: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    redWinePreferences: any
    whiteWinePreferences: any
    sparklingPreferences: any
    generalPreferences: any
    confidenceScore: number
    educationalRecommendations: string[]
  }
  onComplete: () => void
  onRetake: () => void
  className?: string
}

export function QuizResult({
  result,
  onComplete,
  className
}: QuizResultProps) {
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
  const educationalInfo = educationalContent[result.experienceLevel]

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Your Wine Profile is Ready!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {educationalInfo.welcome}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Experience Level and Confidence */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="user" size="sm" className="mr-2" />
              Experience Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <Badge 
                variant={experienceLevelColors[result.experienceLevel]}
                className="text-lg px-4 py-2"
              >
                {experienceLevelLabels[result.experienceLevel]}
              </Badge>
              <p className="text-gray-600">
                We'll tailor our recommendations to match your wine journey
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="star" size="sm" className="mr-2" />
              Profile Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-primary">
                {confidencePercentage}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${confidencePercentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {confidencePercentage >= 80 
                  ? 'Excellent! We have a strong understanding of your preferences.'
                  : confidencePercentage >= 60
                  ? 'Good! We can make solid recommendations and learn more as you go.'
                  : 'We have a basic understanding. Your profile will improve as you rate wines.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wine Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="heart" size="sm" className="mr-2" />
            Your Wine Preferences
          </CardTitle>
          <CardDescription>
            Based on your responses, here's what we learned about your taste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Palate Portrait Radar */}
            <div className="md:col-span-3">
              <PalatePortrait
                red={result.redWinePreferences}
                white={result.whiteWinePreferences}
                sparkling={result.sparklingPreferences}
              />
            </div>
            {/* Red Wine Preferences */}
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600 flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                Red Wines
              </h4>
              <div className="space-y-2 text-sm">
                <PreferenceItem
                  label="Body"
                  value={result.redWinePreferences.body || 'Medium'}
                />
                <PreferenceItem
                  label="Sweetness"
                  value={`${result.redWinePreferences.sweetness || 2}/10`}
                />
                {result.redWinePreferences.preferredVarietals?.length > 0 && (
                  <div>
                    <span className="font-medium">Varietals:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.redWinePreferences.preferredVarietals.slice(0, 3).map((varietal: string) => (
                        <Badge key={varietal} variant="secondary" className="text-xs">
                          {varietal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* White Wine Preferences */}
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-600 flex items-center">
                <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                White Wines
              </h4>
              <div className="space-y-2 text-sm">
                <PreferenceItem
                  label="Body"
                  value={result.whiteWinePreferences.body || 'Medium'}
                />
                <PreferenceItem
                  label="Sweetness"
                  value={`${result.whiteWinePreferences.sweetness || 3}/10`}
                />
                {result.whiteWinePreferences.preferredVarietals?.length > 0 && (
                  <div>
                    <span className="font-medium">Varietals:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.whiteWinePreferences.preferredVarietals.slice(0, 3).map((varietal: string) => (
                        <Badge key={varietal} variant="secondary" className="text-xs">
                          {varietal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* General Preferences */}
            <div className="space-y-3">
              <h4 className="font-semibold text-primary flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                General
              </h4>
              <div className="space-y-2 text-sm">
                {result.generalPreferences.priceRange && (
                  <PreferenceItem
                    label="Budget"
                    value={`$${result.generalPreferences.priceRange.min}-${result.generalPreferences.priceRange.max}`}
                  />
                )}
                <PreferenceItem
                  label="Food Pairing"
                  value={`${result.generalPreferences.foodPairingImportance || 5}/10 importance`}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single concise tips block */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Icon name="info" size="sm" className="mr-2" />
            Tips for {experienceLevelLabels[result.experienceLevel]}
          </CardTitle>
          <CardDescription className="text-blue-800">
            Practical next steps based on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...result.educationalRecommendations, ...educationalInfo.tips]
              .slice(0, 4)
              .map((tip, index) => (
                <div key={index} className="flex items-start">
                  <Icon name="arrow-right" size="sm" className="text-blue-700 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-blue-900">{tip}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Single CTA to save profile */}
      <div className="flex justify-center">
        <Button
          onClick={onComplete}
          size="lg"
          className="flex items-center"
          aria-label="Create account to save your profile"
        >
          <Icon name="sparkles" size="sm" className="mr-2" />
          Create account to save your profile
        </Button>
      </div>
    </div>
  )
}

/**
 * Helper component for displaying preference items
 */
function PreferenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}