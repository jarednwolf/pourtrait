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
  onRetake,
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
              <h4 className="font-semibold text-purple-600 flex items-center">
                <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
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

      {/* Educational Recommendations */}
      {result.educationalRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="info" size="sm" className="mr-2" />
              Personalized Tips for Your Wine Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.educationalRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <Icon name="arrow-right" size="sm" className="text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Level Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Icon name="info" size="sm" className="mr-2" />
            Tips for {experienceLevelLabels[result.experienceLevel]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {educationalInfo.tips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <Icon name="success" size="sm" className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-blue-800">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onComplete}
          size="lg"
          className="flex items-center"
        >
          <Icon name="arrow-right" size="sm" className="mr-2" />
          Complete Setup
        </Button>
        <Button
          variant="outline"
          onClick={onRetake}
          size="lg"
          className="flex items-center"
        >
          <Icon name="arrow-left" size="sm" className="mr-2" />
          Retake Quiz
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