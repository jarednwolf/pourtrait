/**
 * Onboarding Flow Component
 * 
 * Main onboarding component that manages the complete user onboarding
 * experience including welcome, quiz, and completion steps.
 */

import React from 'react'
import { TasteProfileQuiz } from './TasteProfileQuiz'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingComplete } from './OnboardingComplete'
import { QuizResponse } from '@/lib/onboarding/quiz-data'
import { cn } from '@/lib/design-system/utils'

type OnboardingStep = 'welcome' | 'quiz' | 'complete'

interface OnboardingFlowProps {
  onComplete: (result: any) => void
  onSkip?: () => void
  initialStep?: OnboardingStep
  className?: string
}

export function OnboardingFlow({
  onComplete,
  onSkip,
  initialStep = 'welcome',
  className
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>(initialStep)
  const [quizResponses, setQuizResponses] = React.useState<QuizResponse[]>([])
  const [quizResult, setQuizResult] = React.useState<any>(null)

  const handleStartQuiz = () => {
    setCurrentStep('quiz')
  }

  const handleQuizComplete = (result: any) => {
    setQuizResult(result)
    setCurrentStep('complete')
  }

  const handleOnboardingComplete = () => {
    onComplete(quizResult)
  }

  const handleSkipOnboarding = () => {
    if (onSkip) {
      onSkip()
    } else {
      // Provide default minimal profile
      const defaultResult = {
        experienceLevel: 'beginner' as const,
        redWinePreferences: {
          fruitiness: 6,
          earthiness: 5,
          oakiness: 5,
          acidity: 6,
          tannins: 6,
          sweetness: 2,
          body: 'medium' as const,
          preferredRegions: [],
          preferredVarietals: [],
          dislikedCharacteristics: []
        },
        whiteWinePreferences: {
          fruitiness: 6,
          earthiness: 3,
          oakiness: 3,
          acidity: 7,
          tannins: 1,
          sweetness: 3,
          body: 'medium' as const,
          preferredRegions: [],
          preferredVarietals: [],
          dislikedCharacteristics: []
        },
        sparklingPreferences: {
          fruitiness: 6,
          earthiness: 3,
          oakiness: 2,
          acidity: 8,
          tannins: 1,
          sweetness: 2,
          body: 'light' as const,
          preferredRegions: [],
          preferredVarietals: [],
          dislikedCharacteristics: []
        },
        generalPreferences: {
          priceRange: { min: 0, max: 50, currency: 'USD' },
          occasionPreferences: [],
          foodPairingImportance: 5
        },
        confidenceScore: 0.3,
        educationalRecommendations: [
          'Start with approachable wines like Pinot Noir or Sauvignon Blanc',
          'Try wines from different regions to understand how location affects taste'
        ]
      }
      onComplete(defaultResult)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <OnboardingWelcome
            onStart={handleStartQuiz}
            onSkip={handleSkipOnboarding}
          />
        )
      case 'quiz':
        return (
          <TasteProfileQuiz
            onComplete={handleQuizComplete}
            onSave={setQuizResponses}
            initialResponses={quizResponses}
          />
        )
      case 'complete':
        return (
          <OnboardingComplete
            result={quizResult}
            onComplete={handleOnboardingComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 py-8 px-4', className)}>
      <div className="max-w-4xl mx-auto">
        {renderCurrentStep()}
      </div>
    </div>
  )
}