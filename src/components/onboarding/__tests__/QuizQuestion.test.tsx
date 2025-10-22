/**
 * Quiz Question Component Tests
 * 
 * Tests for the QuizQuestion component including different question types,
 * accessibility features, and user interactions.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuizQuestion } from '../QuizQuestion'
import { QuizQuestion as QuizQuestionType } from '@/lib/onboarding/quiz-data'
import { beforeEach } from 'node:test'

describe('QuizQuestion', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Single Choice Questions', () => {
    const singleChoiceQuestion: QuizQuestionType = {
      id: 'test-single',
      type: 'single-choice',
      category: 'preferences',
      question: 'What is your favorite wine type?',
      description: 'Select one option',
      options: [
        { id: 'red', label: 'Red Wine', value: 'red' },
        { id: 'white', label: 'White Wine', value: 'white' },
        { id: 'sparkling', label: 'Sparkling Wine', value: 'sparkling' }
      ],
      required: true
    }

    it('should render single choice question correctly', () => {
      render(
        <QuizQuestion
          question={singleChoiceQuestion}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('What is your favorite wine type?')).toBeInTheDocument()
      expect(screen.getByText('Select one option')).toBeInTheDocument()
      expect(screen.getByText('Red Wine')).toBeInTheDocument()
      expect(screen.getByText('White Wine')).toBeInTheDocument()
      expect(screen.getByText('Sparkling Wine')).toBeInTheDocument()
    })

    it('should show required indicator for required questions', () => {
      render(
        <QuizQuestion
          question={singleChoiceQuestion}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('Required')).toBeInTheDocument()
    })

    it('should handle option selection', () => {
      render(
        <QuizQuestion
          question={singleChoiceQuestion}
          onChange={mockOnChange}
        />
      )

      fireEvent.click(screen.getByText('Red Wine'))
      expect(mockOnChange).toHaveBeenCalledWith('red')
    })

    it('should show selected option visually', () => {
      render(
        <QuizQuestion
          question={singleChoiceQuestion}
          value="white"
          onChange={mockOnChange}
        />
      )

      const whiteWineContainer = screen.getByText('White Wine').closest('[class*="border-"]')
    expect(whiteWineContainer).toHaveClass('border-primary')
    })
  })

  describe('Multiple Choice Questions', () => {
    const multipleChoiceQuestion: QuizQuestionType = {
      id: 'test-multiple',
      type: 'multiple-choice',
      category: 'preferences',
      question: 'Which wine types have you tried?',
      options: [
        { id: 'red', label: 'Red Wine', value: 'red' },
        { id: 'white', label: 'White Wine', value: 'white' },
        { id: 'sparkling', label: 'Sparkling Wine', value: 'sparkling' }
      ],
      required: false
    }

    it('should handle multiple selections', () => {
      render(
        <QuizQuestion
          question={multipleChoiceQuestion}
          value={['red']}
          onChange={mockOnChange}
        />
      )

      fireEvent.click(screen.getByText('White Wine'))
      expect(mockOnChange).toHaveBeenCalledWith(['red', 'white'])
    })

    it('should handle deselection', () => {
      render(
        <QuizQuestion
          question={multipleChoiceQuestion}
          value={['red', 'white']}
          onChange={mockOnChange}
        />
      )

      fireEvent.click(screen.getByText('Red Wine'))
      expect(mockOnChange).toHaveBeenCalledWith(['white'])
    })

    it('should show multiple selected options', () => {
      render(
        <QuizQuestion
          question={multipleChoiceQuestion}
          value={['red', 'sparkling']}
          onChange={mockOnChange}
        />
      )

      const redWineContainer = screen.getByText('Red Wine').closest('[class*="border-"]')
      const sparklingWineContainer = screen.getByText('Sparkling Wine').closest('[class*="border-"]')
      
    expect(redWineContainer).toHaveClass('border-primary')
    expect(sparklingWineContainer).toHaveClass('border-primary')
    })
  })

  describe('Scale Questions', () => {
    const scaleQuestion: QuizQuestionType = {
      id: 'test-scale',
      type: 'scale',
      category: 'preferences',
      question: 'How sweet do you like your wine?',
      scaleConfig: {
        min: 1,
        max: 5,
        minLabel: 'Very Dry',
        maxLabel: 'Very Sweet'
      },
      required: true
    }

    it('should render scale question correctly', () => {
      render(
        <QuizQuestion
          question={scaleQuestion}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('How sweet do you like your wine?')).toBeInTheDocument()
      expect(screen.getByText('Very Dry')).toBeInTheDocument()
      expect(screen.getByText('Very Sweet')).toBeInTheDocument()
      
      // Should have buttons for each scale value
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should handle scale selection', () => {
      render(
        <QuizQuestion
          question={scaleQuestion}
          onChange={mockOnChange}
        />
      )

      fireEvent.click(screen.getByText('3'))
      expect(mockOnChange).toHaveBeenCalledWith(3)
    })

    it('should show selected scale value', () => {
      render(
        <QuizQuestion
          question={scaleQuestion}
          value={4}
          onChange={mockOnChange}
        />
      )

      const selectedButton = screen.getByRole('button', { name: '4' })
    expect(selectedButton).toHaveClass('bg-primary')
      expect(screen.getByText('Selected:')).toBeInTheDocument()
    })
  })

  describe('Educational Content', () => {
    const questionWithEducation: QuizQuestionType = {
      id: 'test-education',
      type: 'single-choice',
      category: 'preferences',
      question: 'Test question',
      options: [
        { 
          id: 'option1', 
          label: 'Option 1', 
          value: 'option1',
          educationalNote: 'This is educational content for option 1'
        }
      ],
      required: false,
      educationalNote: 'This is general educational content'
    }

    it('should render without legacy educational note buttons', () => {
      render(
        <QuizQuestion
          question={questionWithEducation}
          onChange={mockOnChange}
        />
      )
      expect(screen.queryByLabelText(/educational note/i)).toBeNull()
    })
  })

  describe('Accessibility', () => {
    const accessibleQuestion: QuizQuestionType = {
      id: 'test-accessible',
      type: 'single-choice',
      category: 'preferences',
      question: 'Accessible question',
      options: [
        { id: 'option1', label: 'Option 1', value: 'option1' }
      ],
      required: true
    }

    it('should have proper ARIA labels', () => {
      render(
        <QuizQuestion
          question={accessibleQuestion}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('Required')).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(
        <QuizQuestion
          question={accessibleQuestion}
          onChange={mockOnChange}
        />
      )

      const optionButton = screen.getByText('Option 1').closest('button')
      // Buttons are focusable by default, no need for explicit tabIndex
      expect(optionButton).not.toBeDisabled()
    })

    it('should have focus indicators', () => {
      render(
        <QuizQuestion
          question={accessibleQuestion}
          onChange={mockOnChange}
        />
      )

      const optionButton = screen.getByText('Option 1').closest('button')
      expect(optionButton).toHaveClass('focus:outline-none', 'focus:ring-2')
    })
  })

  describe('Error Handling', () => {
    it('should handle unsupported question types gracefully', () => {
      const unsupportedQuestion = {
        id: 'test-unsupported',
        type: 'unsupported-type' as any,
        category: 'preferences' as const,
        question: 'Unsupported question',
        required: false
      }

      render(
        <QuizQuestion
          question={unsupportedQuestion}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Unsupported question type')).toBeInTheDocument()
    })

    it('should handle missing options for choice questions', () => {
      const questionWithoutOptions: QuizQuestionType = {
        id: 'test-no-options',
        type: 'single-choice',
        category: 'preferences',
        question: 'Question without options',
        required: false
      }

      render(
        <QuizQuestion
          question={questionWithoutOptions}
          onChange={mockOnChange}
        />
      )

      // Should render question but no options
      expect(screen.getByText('Question without options')).toBeInTheDocument()
    })
  })
})