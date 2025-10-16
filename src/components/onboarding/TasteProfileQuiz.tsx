/**
 * Taste Profile Quiz Component
 * 
 * Main quiz interface that guides users through the taste profile questionnaire
 * with progress tracking, validation, and educational content.
 */

import React from 'react'
import { QuizQuestion } from './QuizQuestion'
import { QuizProgress } from './QuizProgress'
import { QuizResult } from './QuizResult'
import { quizQuestions, QuizResponse } from '@/lib/onboarding/quiz-data'
import { calculateTasteProfile, validateQuizResponses } from '@/lib/onboarding/quiz-calculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/design-system/utils'

interface TasteProfileQuizProps {
  onComplete: (result: any) => void
  onSave?: (responses: QuizResponse[]) => void
  initialResponses?: QuizResponse[]
  className?: string
}

export function TasteProfileQuiz({
  onComplete,
  onSave,
  initialResponses = [],
  className
}: TasteProfileQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [responses, setResponses] = React.useState<QuizResponse[]>(initialResponses)
  const [showResult, setShowResult] = React.useState(false)
  const [quizResult, setQuizResult] = React.useState<any>(null)
  const [errors, setErrors] = React.useState<string[]>([])
  const LOCAL_KEY = 'pourtrait_quiz_responses_v1'
  // Load saved responses from localStorage (pre-auth persistence)
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        const raw = window.localStorage.getItem(LOCAL_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            setResponses(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })))
          }
        }
      }
    } catch {}
  }, [])

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]))
  const currentValue = responseMap.get(currentQuestion.id)

  // Auto-save responses when they change
  React.useEffect(() => {
    if (onSave && responses.length > 0) {
      onSave(responses)
    }
    // persist locally pre-auth
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(responses))
      }
    } catch {}
  }, [responses, onSave])

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
    const validation = validateQuizResponses(responses)
    
    if (!validation.isValid) {
      setErrors([
        ...validation.errors,
        ...validation.missingRequired.map(id => {
          const question = quizQuestions.find(q => q.id === id)
          return `Please answer: ${question?.question || id}`
        })
      ])
      return
    }

    const result = calculateTasteProfile(responses)
    setQuizResult(result)
    setShowResult(true)
  }

  const handleCompleteOnboarding = () => {
    if (quizResult) {
      onComplete(quizResult)
    }
  }

  const handleRetakeQuiz = () => {
    setShowResult(false)
    setCurrentQuestionIndex(0)
    setResponses([])
    setQuizResult(null)
    setErrors([])
  }

  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100

  if (showResult && quizResult) {
    return (
      <QuizResult
        result={quizResult}
        onComplete={handleCompleteOnboarding}
        onRetake={handleRetakeQuiz}
        className={className}
      />
    )
  }

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Discover Your Wine Preferences
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Help us understand your taste preferences so we can recommend wines you'll love
          </p>
        </CardHeader>
      </Card>

      {/* Progress */}
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={quizQuestions.length}
        progress={progress}
      />

      {/* Current Question */}
      <QuizQuestion
        question={currentQuestion}
        value={currentValue}
        onChange={handleResponseChange}
        showEducationalNote={false}
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
          <span>{quizQuestions.length}</span>
        </div>

        <Button
          onClick={handleNext}
          disabled={!!(currentQuestion.required && currentValue === undefined)}
          aria-disabled={!!(currentQuestion.required && currentValue === undefined)}
          className="flex items-center"
        >
          {isLastQuestion ? 'Finish' : 'Next'}
          <Icon name="arrow-right" size="sm" className="ml-2" />
        </Button>
      </div>

      {/* Question Categories Legend */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Experience</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Preferences</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Lifestyle</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Food Pairing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}