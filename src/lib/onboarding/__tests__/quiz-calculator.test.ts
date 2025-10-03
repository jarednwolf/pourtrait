/**
 * Quiz Calculator Tests
 * 
 * Comprehensive tests for the taste profile calculation logic
 * and validation functions.
 */

import { describe, it, expect } from 'vitest'
import { calculateTasteProfile, validateQuizResponses } from '../quiz-calculator'
import { QuizResponse } from '../quiz-data'

describe('Quiz Calculator', () => {
  describe('calculateTasteProfile', () => {
    it('should calculate basic taste profile from minimal responses', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'experience-level',
          value: 'beginner',
          timestamp: new Date()
        },
        {
          questionId: 'price-range',
          value: { min: 15, max: 30 },
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.experienceLevel).toBe('beginner')
      expect(result.generalPreferences.priceRange).toEqual({
        min: 15,
        max: 30,
        currency: 'USD'
      })
      expect(result.confidenceScore).toBeGreaterThan(0)
      expect(result.educationalRecommendations.length).toBeGreaterThan(0)
    })

    it('should calculate red wine preferences based on flavor intensity', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'experience-level',
          value: 'intermediate',
          timestamp: new Date()
        },
        {
          questionId: 'flavor-intensity',
          value: 'bold',
          timestamp: new Date()
        },
        {
          questionId: 'body-preference',
          value: 'full',
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.redWinePreferences.fruitiness).toBe(8)
      expect(result.redWinePreferences.earthiness).toBe(7)
      expect(result.redWinePreferences.oakiness).toBe(7)
      expect(result.redWinePreferences.tannins).toBe(8)
      expect(result.redWinePreferences.body).toBe('full')
    })

    it('should calculate white wine preferences differently from red', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'experience-level',
          value: 'intermediate',
          timestamp: new Date()
        },
        {
          questionId: 'flavor-intensity',
          value: 'subtle',
          timestamp: new Date()
        },
        {
          questionId: 'sweetness-preference',
          value: 6,
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      // White wines should have higher acidity and lower tannins
      expect(result.whiteWinePreferences.acidity).toBeGreaterThan(
        result.redWinePreferences.acidity
      )
      expect(result.whiteWinePreferences.tannins).toBeLessThan(
        result.redWinePreferences.tannins
      )
      expect(result.whiteWinePreferences.sweetness).toBe(6)
    })

    it('should set varietal preferences based on wine types tried', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'experience-level',
          value: 'advanced',
          timestamp: new Date()
        },
        {
          questionId: 'wine-types-tried',
          value: ['red-light', 'red-full', 'white-crisp'],
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.redWinePreferences.preferredVarietals).toContain('Pinot Noir')
      expect(result.redWinePreferences.preferredVarietals).toContain('Cabernet Sauvignon')
      expect(result.whiteWinePreferences.preferredVarietals).toContain('Sauvignon Blanc')
    })

    it('should calculate confidence score based on completeness', () => {
      const completeResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'intermediate', timestamp: new Date() },
        { questionId: 'drinking-frequency', value: 'weekly', timestamp: new Date() },
        { questionId: 'price-range', value: { min: 20, max: 50 }, timestamp: new Date() },
        { questionId: 'sweetness-preference', value: 4, timestamp: new Date() },
        { questionId: 'body-preference', value: 'medium', timestamp: new Date() },
        { questionId: 'food-pairing-importance', value: 7, timestamp: new Date() },
        { questionId: 'flavor-intensity', value: 'moderate', timestamp: new Date() }
      ]

      const incompleteResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() }
      ]

      const completeResult = calculateTasteProfile(completeResponses)
      const incompleteResult = calculateTasteProfile(incompleteResponses)

      expect(completeResult.confidenceScore).toBeGreaterThan(
        incompleteResult.confidenceScore
      )
    })

    it('should provide experience-appropriate educational recommendations', () => {
      const beginnerResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() }
      ]

      const advancedResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'advanced', timestamp: new Date() }
      ]

      const beginnerResult = calculateTasteProfile(beginnerResponses)
      const advancedResult = calculateTasteProfile(advancedResponses)

      expect(beginnerResult.educationalRecommendations.some(rec => 
        /approachable|Pinot Noir|Sauvignon Blanc/i.test(rec)
      )).toBe(true)
      expect(advancedResult.educationalRecommendations.some(rec => 
        /specific producers|vintages|cellar/i.test(rec)
      )).toBe(true)
    })

    it('should handle regional preferences correctly', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'experience-level',
          value: 'intermediate',
          timestamp: new Date()
        },
        {
          questionId: 'regional-interest',
          value: ['france', 'italy', 'california'],
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.redWinePreferences.preferredRegions).toContain('Bordeaux')
      expect(result.redWinePreferences.preferredRegions).toContain('Tuscany')
      expect(result.redWinePreferences.preferredRegions).toContain('Napa Valley')
    })
  })

  describe('validateQuizResponses', () => {
    it('should validate complete required responses', () => {
      const responses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() },
        { questionId: 'drinking-frequency', value: 'monthly', timestamp: new Date() },
        { questionId: 'price-range', value: { min: 15, max: 30 }, timestamp: new Date() },
        { questionId: 'sweetness-preference', value: 5, timestamp: new Date() },
        { questionId: 'body-preference', value: 'medium', timestamp: new Date() },
        { questionId: 'food-pairing-importance', value: 6, timestamp: new Date() },
        { questionId: 'flavor-intensity', value: 'moderate', timestamp: new Date() }
      ]

      const validation = validateQuizResponses(responses)



      expect(validation.isValid).toBe(true)
      expect(validation.missingRequired).toHaveLength(0)
      expect(validation.errors).toHaveLength(0)
    })

    it('should identify missing required responses', () => {
      const responses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() }
        // Missing other required questions
      ]

      const validation = validateQuizResponses(responses)

      expect(validation.isValid).toBe(false)
      expect(validation.missingRequired.length).toBeGreaterThan(0)
      expect(validation.missingRequired).toContain('drinking-frequency')
    })

    it('should validate scale question values', () => {
      const responses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() },
        { questionId: 'sweetness-preference', value: 15, timestamp: new Date() } // Invalid: max is 10
      ]

      const validation = validateQuizResponses(responses)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => 
        error.includes('sweetness-preference')
      )).toBe(true)
    })

    it('should validate single-choice question values', () => {
      const responses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'expert', timestamp: new Date() } // Invalid option
      ]

      const validation = validateQuizResponses(responses)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => 
        error.includes('experience-level')
      )).toBe(true)
    })

    it('should handle unknown question IDs', () => {
      const responses: QuizResponse[] = [
        { questionId: 'unknown-question', value: 'some-value', timestamp: new Date() }
      ]

      const validation = validateQuizResponses(responses)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Unknown question: unknown-question')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty responses gracefully', () => {
      const responses: QuizResponse[] = []
      const result = calculateTasteProfile(responses)

      expect(result.experienceLevel).toBe('beginner') // Default fallback
      expect(result.confidenceScore).toBeLessThan(0.5)
      expect(result.redWinePreferences).toBeDefined()
      expect(result.whiteWinePreferences).toBeDefined()
    })

    it('should infer experience level from other responses when not explicitly provided', () => {
      const responses: QuizResponse[] = [
        {
          questionId: 'wine-types-tried',
          value: ['red-light', 'red-medium', 'red-full', 'white-crisp', 'white-rich', 'sparkling'],
          timestamp: new Date()
        },
        {
          questionId: 'drinking-frequency',
          value: 'weekly',
          timestamp: new Date()
        }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.experienceLevel).toBe('advanced')
    })

    it('should handle "varies" body preference appropriately', () => {
      const responses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'intermediate', timestamp: new Date() },
        { questionId: 'body-preference', value: 'varies', timestamp: new Date() }
      ]

      const result = calculateTasteProfile(responses)

      expect(result.redWinePreferences.body).toBe('medium')
      expect(result.whiteWinePreferences.body).toBe('medium')
    })

    it('should provide consistency bonus for aligned preferences', () => {
      const consistentResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() },
        { questionId: 'flavor-intensity', value: 'subtle', timestamp: new Date() },
        { questionId: 'body-preference', value: 'light', timestamp: new Date() },
        { questionId: 'wine-types-tried', value: ['red-light'], timestamp: new Date() }
      ]

      const inconsistentResponses: QuizResponse[] = [
        { questionId: 'experience-level', value: 'beginner', timestamp: new Date() },
        { questionId: 'flavor-intensity', value: 'bold', timestamp: new Date() },
        { questionId: 'body-preference', value: 'light', timestamp: new Date() },
        { questionId: 'wine-types-tried', value: ['red-light', 'red-medium', 'red-full', 'white-crisp', 'white-rich'], timestamp: new Date() }
      ]

      const consistentResult = calculateTasteProfile(consistentResponses)
      const inconsistentResult = calculateTasteProfile(inconsistentResponses)

      expect(consistentResult.confidenceScore).toBeGreaterThanOrEqual(
        inconsistentResult.confidenceScore
      )
    })
  })
})