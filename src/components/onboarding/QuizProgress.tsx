/**
 * Quiz Progress Component
 * 
 * Displays progress through the quiz with visual indicators
 * and accessibility features.
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/design-system/utils'

interface QuizProgressProps {
  currentQuestion: number
  totalQuestions: number
  progress: number
  className?: string
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  progress,
  className
}: QuizProgressProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Quiz progress: ${Math.round(progress)}% complete`}
              />
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="font-medium text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mt-4">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const questionNumber = index + 1
              const isCompleted = questionNumber < currentQuestion
              const isCurrent = questionNumber === currentQuestion
              
              return (
                <div
                  key={questionNumber}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    isCompleted && 'bg-primary text-white',
                    isCurrent && 'bg-primary/10 text-primary ring-2 ring-primary',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                  )}
                  aria-label={
                    isCompleted 
                      ? `Question ${questionNumber} completed`
                      : isCurrent 
                      ? `Question ${questionNumber} current`
                      : `Question ${questionNumber} upcoming`
                  }
                >
                  {questionNumber}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}