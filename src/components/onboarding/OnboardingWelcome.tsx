/**
 * Onboarding Welcome Component
 * 
 * Welcome screen that introduces users to the taste profile quiz
 * and sets expectations for the onboarding process.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/design-system/utils'

interface OnboardingWelcomeProps {
  onStart: () => void
  onSkip: () => void
  className?: string
}

export function OnboardingWelcome({
  onStart,
  onSkip,
  className
}: OnboardingWelcomeProps) {
  return (
    <div className={cn('max-w-3xl mx-auto space-y-8', className)}>
      {/* Main Welcome Card */}
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Icon name="heart" size="lg" className="text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to Pourtrait
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            We’ll get a quick baseline today and keep learning your palate over time as you explore and give feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <FeatureCard
              icon="user"
              title="Personalized"
              description="Tailored recommendations based on your unique taste preferences and experience level"
            />
            <FeatureCard
              icon="info"
              title="Educational"
              description="Learn about wine in approachable, jargon-free language as you explore"
            />
            <FeatureCard
              icon="star"
              title="Adaptive"
              description="Your profile improves over time as you rate wines and provide feedback"
            />
          </div>
        </CardContent>
      </Card>

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="info" size="sm" className="mr-2" />
            What to Expect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ExpectationItem
              step="1"
              title="Quick Questions"
              description="We'll ask about your wine experience, preferences, and lifestyle (takes about 5 minutes)"
            />
            <ExpectationItem
              step="2"
              title="Taste Profile"
              description="We'll create your personalized wine profile based on your responses"
            />
            <ExpectationItem
              step="3"
              title="Smart Recommendations"
              description="Start receiving wine recommendations tailored specifically to your taste"
            />
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-primary/5 border-primary/40">
        <CardHeader>
          <CardTitle className="text-gray-900">
            Why Create a Taste Profile?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <BenefitItem
              icon="heart"
              text="Discover wines that match your personal taste preferences"
            />
            <BenefitItem
              icon="star"
              text="Get recommendations that improve as you rate wines"
            />
            <BenefitItem
              icon="info"
              text="Learn about wine in a way that matches your experience level"
            />
            <BenefitItem
              icon="globe"
              text="Explore new regions and styles with confidence"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Icon name="info" size="sm" className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your Privacy Matters</p>
              <p>
                Your taste profile is private and secure. We use this information only to 
                improve your wine recommendations and never share it with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onStart}
          size="lg"
          className="flex items-center"
        >
          <Icon name="arrow-right" size="sm" className="mr-2" />
          Start Taste Profile Quiz
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
          size="lg"
          className="flex items-center"
        >
          Skip for Now
        </Button>
      </div>

      {/* Time Estimate */}
      <div className="text-center text-sm text-gray-500">
        <Icon name="clock" size="sm" className="inline mr-1" />
        Takes about 5 minutes
      </div>
    </div>
  )
}

/**
 * Feature Card Component
 */
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon name={icon as any} size="sm" className="text-gray-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

/**
 * Expectation Item Component
 */
function ExpectationItem({
  step,
  title,
  description
}: {
  step: string
  title: string
  description: string
}) {
  return (
      <div className="flex items-start">
      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
        {step}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      </div>
    </div>
  )
}

/**
 * Benefit Item Component
 */
function BenefitItem({
  icon,
  text
}: {
  icon: string
  text: string
}) {
  return (
    <div className="flex items-start">
      <Icon name={icon as any} size="sm" className="text-primary mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-gray-800 text-sm">{text}</p>
    </div>
  )
}