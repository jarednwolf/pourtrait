/**
 * Demo Taste Profile Quiz Component
 * 
 * A simplified version of the taste profile quiz designed for demo purposes.
 * Collects basic preferences and generates sample recommendations without requiring signup.
 */

import React from 'react'
import { QuizQuestion } from '@/components/onboarding/QuizQuestion'
import { QuizProgress } from '@/components/onboarding/QuizProgress'
import { quizQuestions, QuizResponse } from '@/lib/onboarding/quiz-data'
import { calculateTasteProfile } from '@/lib/onboarding/quiz-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/design-system/utils'

interface DemoTasteProfileQuizProps {
  onComplete: (result: any) => void
  className?: string
}

// Simplified quiz questions for demo (first 5 questions)
const demoQuestions = quizQuestions.slice(0, 5)

export function DemoTasteProfileQuiz({
  onComplete,
  className
}: DemoTasteProfileQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [responses, setResponses] = React.useState<QuizResponse[]>([])
  const [errors, setErrors] = React.useState<string[]>([])

  const currentQuestion = demoQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === demoQuestions.length - 1
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]))
  const currentValue = responseMap.get(currentQuestion.id)

  const handleResponseChange = (value: any) => {
    const newResponse: QuizResponse = {
      questionId: currentQuestion.id,
      value,
      timestamp: new Date()
    }

    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== currentQuestion.id)
      return [...filtered, newResponse]
    })

    // Clear any errors for this question
    setErrors(prev => prev.filter(error => !error.includes(currentQuestion.id)))
  }

  const handleNext = () => {
    // Validate current question if required
    if (currentQuestion.required && currentValue === undefined) {
      setErrors([`Please answer the question: ${currentQuestion.question}`])
      return
    }

    if (isLastQuestion) {
      handleFinishQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setErrors([])
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setErrors([])
    }
  }

  const handleFinishQuiz = () => {
    const result = calculateTasteProfile(responses)
    onComplete(result)
  }

  const progress = ((currentQuestionIndex + 1) / demoQuestions.length) * 100

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Demo: Discover Your Wine Style
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Answer a few quick questions to see how our AI sommelier works
          </p>
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Icon name="info" size="sm" className="mr-1" />
              Demo Mode - No signup required
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={demoQuestions.length}
        progress={progress}
      />

      {/* Current Question */}
      <QuizQuestion
        question={currentQuestion}
        value={currentValue}
        onChange={handleResponseChange}
        showEducationalNote={true}
      />

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <Icon name="error" size="sm" className="text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-800">{error}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center"
        >
          <Icon name="arrow-left" size="sm" className="mr-2" />
          Previous
        </Button>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{currentQuestionIndex + 1}</span>
          <span>of</span>
          <span>{demoQuestions.length}</span>
        </div>

        <Button
          onClick={handleNext}
          disabled={currentQuestion.required && currentValue === undefined}
          className="flex items-center"
        >
          {isLastQuestion ? 'Get My Recommendations' : 'Next'}
          <Icon name="arrow-right" size="sm" className="ml-2" />
        </Button>
      </div>

      {/* Demo Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Icon name="lightbulb" size="sm" className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">This is just a taste of what Pourtrait can do!</p>
              <p>The full version includes your complete wine inventory, detailed recommendations, and personalized learning.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}