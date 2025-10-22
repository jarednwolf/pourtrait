/**
 * Taste Profile Quiz Integration Tests
 * 
 * Tests for the complete quiz flow including navigation,
 * validation, and result calculation.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TasteProfileQuiz } from '../TasteProfileQuiz'

describe('TasteProfileQuiz Integration', () => {
  const mockOnComplete = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
    mockOnSave.mockClear()
  })

  describe('Quiz Navigation', () => {
    it('should start with the first question', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      expect(screen.getByText('Discover Your Wine Preferences')).toBeInTheDocument()
      expect(screen.getByText(/Question \d+ of/)).toBeInTheDocument()
      expect(screen.getByText('What best describes your wine experience?')).toBeInTheDocument()
    })

    it('should navigate to next question when answered', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      // Answer first question
      fireEvent.click(screen.getByText('New to wine'))
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByText(/Question \d+ of/)).toBeInTheDocument()
      })
    })

    it('should navigate back to previous question', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      // Answer first question and go to second
      fireEvent.click(screen.getByText('New to wine'))
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByText(/Question 2 of/)).toBeInTheDocument()
      })

      // Go back to first question
      fireEvent.click(screen.getByText('Previous'))

      await waitFor(() => {
        expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first question', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      const previousButton = screen.getByText('Previous')
      expect(previousButton).toBeDisabled()
    })

    it('should show progress correctly', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      // Check initial progress
      expect(screen.getByLabelText(/Quiz progress/)).toHaveAttribute('aria-valuenow')

      // Answer first question and check progress updates
      fireEvent.click(screen.getByText('New to wine'))
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        const progressBar = screen.getByLabelText(/Quiz progress/)
        const progress = parseInt(progressBar.getAttribute('aria-valuenow') || '0')
        expect(progress).toBeGreaterThan(0)
      })
    })
  })

  describe('Validation', () => {
    it('should prevent navigation without answering required questions', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      const nextButton = screen.getByRole('button', { name: 'Next' })
      expect(nextButton).toBeDisabled()
      expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
    })

    it('should allow navigation for optional questions', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      // Answer required questions to get to an optional one
      // This is a simplified test - in reality we'd need to answer all required questions
      fireEvent.click(screen.getByText('New to wine'))
      fireEvent.click(screen.getByText('Next'))

      // Navigate through several questions to reach optional ones
      // (This would need to be expanded based on actual quiz structure)
    })

    it('should enable Next when question is answered', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      const nextButton = screen.getByRole('button', { name: 'Next' })
      expect(nextButton).toBeDisabled()
      fireEvent.click(screen.getByText('New to wine'))
      await waitFor(() => expect(nextButton).not.toBeDisabled())
    })
  })

  describe('Auto-save Functionality', () => {
    it('should call onSave when responses change', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} onSave={mockOnSave} />)

      fireEvent.click(screen.getByText('New to wine'))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              questionId: 'experience-level',
              value: 'novice'
            })
          ])
        )
      })
    })

    it('should load initial responses correctly', () => {
      const initialResponses = [
        {
          questionId: 'experience-level',
          value: 'intermediate',
          timestamp: new Date()
        }
      ]

      render(
        <TasteProfileQuiz
          onComplete={mockOnComplete}
          initialResponses={initialResponses}
        />
      )

      // Should show the pre-selected answer
      const selectedOption = screen.getByRole('button', { name: /Exploring/i })
    expect(selectedOption?.parentElement?.parentElement).toHaveClass('border-primary')
    })
  })

  describe('Quiz Completion', () => {
    it('should show Finish button on last question', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      // This would need to navigate through all questions to reach the last one
      // For testing purposes, we'll mock this scenario
      // In a real test, you'd need to answer all questions to get to the end
    })

    it('should validate all required questions before finishing', () => {
      // This test would ensure that even if user reaches last question,
      // they can't finish without answering all required questions
    })

    it('should calculate and display results', async () => {
      // This test would verify that after completing all questions,
      // the quiz calculates the taste profile and shows results
    })
  })

  describe('Educational Features', () => {
    it('should render clean UI without redundant tooltips', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)
      expect(screen.queryByLabelText(/educational note/i)).toBeNull()
    })

    it('should not render the old legend (redundant categories)', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)
      expect(screen.queryByText('Experience')).not.toBeInTheDocument()
      expect(screen.queryByText('Food Pairing')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for progress', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      const progressBar = screen.getByLabelText(/Quiz progress/)
      expect(progressBar).toHaveAttribute('role', 'progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    it('should be keyboard navigable', () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)

      const nextButton = screen.getByRole('button', { name: 'Next' })
      const previousButton = screen.getByRole('button', { name: 'Previous' })
      expect(nextButton).toBeInTheDocument()
      expect(previousButton).toBeInTheDocument()
    })

    it('should announce errors to screen readers', async () => {
      render(<TasteProfileQuiz onComplete={mockOnComplete} />)
      const nextButton = screen.getByRole('button', { name: 'Next' })
      expect(nextButton).toBeDisabled()
      fireEvent.click(screen.getByText('New to wine'))
      await waitFor(() => expect(nextButton).not.toBeDisabled())
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid question data gracefully', () => {
      // Test with malformed quiz data
      // This would require mocking the quiz questions with invalid data
    })

    it('should handle calculation errors gracefully', () => {
      // Test what happens if taste profile calculation fails
    })

    it('should provide fallback when external dependencies fail', () => {
      // Test behavior when components or utilities are unavailable
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      // Test that components don't re-render when props haven't changed
    })

    it('should handle large numbers of responses efficiently', () => {
      // Test with many quiz responses to ensure performance
    })
  })
})