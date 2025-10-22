/**
 * Individual Quiz Question Component
 * 
 * Renders different question types with appropriate UI controls
 * and educational content for the taste profile quiz.
 */

import React from 'react'
import { QuizQuestion as QuizQuestionType, QuizOption } from '@/lib/onboarding/quiz-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/design-system/utils'

interface QuizQuestionProps {
  question: QuizQuestionType
  value?: any
  onChange: (value: any) => void
  showEducationalNote?: boolean
  className?: string
}

export function QuizQuestion({
  question,
  value,
  onChange,
  className
}: QuizQuestionProps) {

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <SingleChoiceQuestion
            question={question}
            value={value}
            onChange={onChange}
          />
        )
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            value={value || []}
            onChange={onChange}
          />
        )
      case 'scale':
        return (
          <ScaleQuestion
            question={question}
            value={value}
            onChange={onChange}
          />
        )
      default:
        return <div>Unsupported question type</div>
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {question.question}
              {question.required && (
                <span className="ml-1 text-red-500" aria-label="Required">*</span>
              )}
            </CardTitle>
            {question.description && (
              <CardDescription className="mt-2 text-gray-600">
                {question.description}
              </CardDescription>
            )}
          </div>
          {/* Educational toggle removed for cleaner UI */}
        </div>
        
        {false && question.educationalNote && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-start">
              <Icon name="info" size="sm" className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-blue-800">{question.educationalNote}</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {renderQuestionContent()}
      </CardContent>
    </Card>
  )
}

/**
 * Single Choice Question Component
 */
function SingleChoiceQuestion({
  question,
  value,
  onChange
}: {
  question: QuizQuestionType
  value?: any
  onChange: (value: any) => void
}) {
  if (!question.options) {return null}

  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          isSelected={value === option.value}
          onClick={() => onChange(option.value)}
          selectionType="single"
        />
      ))}
    </div>
  )
}

/**
 * Multiple Choice Question Component
 */
function MultipleChoiceQuestion({
  question,
  value,
  onChange
}: {
  question: QuizQuestionType
  value: any[]
  onChange: (value: any[]) => void
}) {
  if (!question.options) {return null}

  const handleOptionToggle = (optionValue: any) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          isSelected={value.includes(option.value)}
          onClick={() => handleOptionToggle(option.value)}
          selectionType="multiple"
        />
      ))}
    </div>
  )
}

/**
 * Scale Question Component
 */
function ScaleQuestion({
  question,
  value,
  onChange
}: {
  question: QuizQuestionType
  value?: number
  onChange: (value: number) => void
}) {
  if (!question.scaleConfig) {return null}

  const { min, max, minLabel, maxLabel, step = 1 } = question.scaleConfig
  const scaleValues = []
  
  for (let i = min; i <= max; i += step) {
    scaleValues.push(i)
  }

  return (
    <div className="space-y-6">
      {/* Scale Labels */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      
      {/* Scale Buttons */}
      <div className="flex justify-between gap-2">
        {scaleValues.map((scaleValue) => (
          <Button
            key={scaleValue}
            variant={value === scaleValue ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onChange(scaleValue)}
            className="flex-1 min-w-0"
          >
            {scaleValue}
          </Button>
        ))}
      </div>
      
      {/* Current Selection Display */}
      {value !== undefined && (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Selected: <span className="font-medium text-gray-900">{value}</span>
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Option Card Component for Single and Multiple Choice
 */
function OptionCard({
  option,
  isSelected,
  onClick,
  selectionType
}: {
  option: QuizOption
  isSelected: boolean
  onClick: () => void
  selectionType: 'single' | 'multiple'
}) {
  // Per-option educational toggles removed

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'w-full rounded-lg border-2 transition-all duration-200',
          isSelected
            ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2'
            : 'border-gray-200 bg-white'
        )}
      >
        <div className="flex items-start">
          {/* Main Option Button */}
          <button
            onClick={onClick}
            className={cn(
              'flex-1 text-left p-4 rounded-l-lg transition-all duration-200',
              'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
          >
            <div className="flex items-start space-x-3">
              {/* Selection Indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {selectionType === 'single' ? (
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <Icon name="success" size="xs" className="text-white" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Option Content */}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="mt-1 text-sm text-gray-600">{option.description}</div>
                )}
              </div>
            </div>
          </button>
          
          {/* Option-level info button removed */}
        </div>
      </div>
      
      {/* Option-level educational note removed */}
    </div>
  )
}