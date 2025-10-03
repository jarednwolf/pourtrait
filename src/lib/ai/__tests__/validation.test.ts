// AI Response Validation Tests

import { describe, it, expect } from 'vitest'
import { ResponseValidator, ResponseEnhancer } from '../validation'
import { ResponseGuidelines } from '../types'

describe('ResponseValidator', () => {
  const mockGuidelines: ResponseGuidelines = {
    noEmojis: true,
    tone: 'professional_sommelier',
    includeEducation: false,
    vocabularyLevel: 'intermediate',
    maxLength: 1000
  }

  describe('validateResponse', () => {
    it('should pass validation for professional sommelier response', () => {
      const response = `I recommend the 2019 Caymus Cabernet Sauvignon from Napa Valley. This wine pairs excellently with your steak dinner because its bold tannins and rich fruit flavors complement the meat's richness. The wine shows characteristics of blackberry and vanilla, with a full body that matches your preference profile.`

      const result = ResponseValidator.validateResponse(response, mockGuidelines)

      expect(result.passed).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.score).toBeGreaterThan(80)
    })

    it('should fail validation when emojis are detected', () => {
      const response = `I recommend this amazing wine! 🍷 It's perfect for your dinner 😊`

      const result = ResponseValidator.validateResponse(response, mockGuidelines)

      expect(result.passed).toBe(false)
      expect(result.errors.some(e => e.type === 'emoji_detected')).toBe(true)
      expect(result.score).toBeLessThan(60)
    })

    it('should fail validation for unprofessional tone', () => {
      const response = `OMG this wine is totally awesome! You guys are gonna love it for sure!`

      const result = ResponseValidator.validateResponse(response, mockGuidelines)

      expect(result.passed).toBe(false)
      expect(result.errors.some(e => e.type === 'inappropriate_tone')).toBe(true)
    })

    it('should fail validation when response is too long', () => {
      const longResponse = 'A'.repeat(1500)
      const shortGuidelines = { ...mockGuidelines, maxLength: 1000 }

      const result = ResponseValidator.validateResponse(longResponse, shortGuidelines)

      expect(result.passed).toBe(false)
      expect(result.errors.some(e => e.type === 'length_exceeded')).toBe(true)
    })

    it('should warn about vocabulary complexity mismatch for beginners', () => {
      const complexResponse = `This wine exhibits exceptional terroir characteristics with pronounced phenolic compounds and malolactic fermentation notes.`
      const beginnerGuidelines = { ...mockGuidelines, vocabularyLevel: 'accessible' as const }

      const result = ResponseValidator.validateResponse(complexResponse, beginnerGuidelines)

      expect(result.warnings.some(w => w.type === 'complexity_mismatch')).toBe(true)
    })

    it('should warn about missing reasoning', () => {
      const response = `Caymus Cabernet Sauvignon. Good wine.`

      const result = ResponseValidator.validateResponse(response, mockGuidelines)

      expect(result.warnings.some(w => w.type === 'incomplete_reasoning')).toBe(true)
    })
  })

  describe('validateFactualAccuracy', () => {
    it('should pass for accurate wine information', () => {
      const response = `Pinot Noir pairs well with salmon due to its lighter tannins and bright acidity.`

      const result = ResponseValidator.validateFactualAccuracy(response)

      expect(result.passed).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should flag potential misconceptions', () => {
      const response = `Red wine with fish is always the best choice for any seafood dish.`

      const result = ResponseValidator.validateFactualAccuracy(response)

      expect(result.errors.some(e => e.type === 'factual_error')).toBe(true)
    })
  })

  describe('comprehensiveValidation', () => {
    it('should combine style and factual validation', () => {
      const response = `I recommend this wine 🍷 because red wine with fish is always perfect!`

      const result = ResponseValidator.comprehensiveValidation(response, mockGuidelines)

      expect(result.passed).toBe(false)
      expect(result.errors.some(e => e.type === 'emoji_detected')).toBe(true)
      expect(result.errors.some(e => e.type === 'factual_error')).toBe(true)
    })
  })
})

describe('ResponseEnhancer', () => {
  const mockGuidelines: ResponseGuidelines = {
    noEmojis: true,
    tone: 'professional_sommelier',
    includeEducation: true,
    vocabularyLevel: 'accessible',
    maxLength: 1000
  }

  describe('enhanceResponse', () => {
    it('should remove emojis from response', () => {
      const response = `Great wine choice! 🍷 This pairs well with dinner 😊`

      const enhanced = ResponseEnhancer.enhanceResponse(response, mockGuidelines)

      expect(enhanced).not.toMatch(/🍷|😊/)
      expect(enhanced).toContain('Great wine choice!')
    })

    it('should improve formatting', () => {
      const response = `Great wine.This pairs well.Try it tonight.`

      const enhanced = ResponseEnhancer.enhanceResponse(response, mockGuidelines)

      expect(enhanced).toContain('Great wine. This pairs well. Try it tonight.')
    })

    it('should add professional closing if missing', () => {
      const response = `I recommend the Cabernet Sauvignon`

      const enhanced = ResponseEnhancer.enhanceResponse(response, mockGuidelines)

      expect(enhanced).toMatch(/enjoy|help|selection/i)
    })

    it('should not duplicate existing professional closings', () => {
      const response = `I recommend the Cabernet Sauvignon. Enjoy your wine selection!`

      const enhanced = ResponseEnhancer.enhanceResponse(response, mockGuidelines)

      const closingCount = (enhanced.match(/enjoy|help|selection/gi) || []).length
      expect(closingCount).toBeLessThanOrEqual(2) // Allow for the existing closing
    })
  })
})

describe('Edge Cases', () => {
  const mockGuidelines: ResponseGuidelines = {
    noEmojis: true,
    tone: 'professional_sommelier',
    includeEducation: false,
    vocabularyLevel: 'intermediate',
    maxLength: 1000
  }

  it('should handle empty response', () => {
    const result = ResponseValidator.validateResponse('', mockGuidelines)

    expect(result.passed).toBe(false)
    expect(result.warnings.some(w => w.type === 'incomplete_reasoning')).toBe(true)
  })

  it('should handle response with only whitespace', () => {
    const result = ResponseValidator.validateResponse('   \n\t   ', mockGuidelines)

    expect(result.passed).toBe(false)
  })

  it('should handle response with mixed emoji types', () => {
    const response = `Wine 🍷 and food 🍽️ pairing with celebration 🎉`

    const result = ResponseValidator.validateResponse(response, mockGuidelines)

    expect(result.passed).toBe(false)
    expect(result.errors[0].message).toContain('🍷')
    expect(result.errors[0].message).toContain('🎉')
    // Note: Some emojis may be detected differently by the regex
  })

  it('should handle very short responses', () => {
    const response = `Yes.`

    const result = ResponseValidator.validateResponse(response, mockGuidelines)

    expect(result.warnings.some(w => w.type === 'incomplete_reasoning')).toBe(true)
  })

  it('should validate advanced vocabulary appropriately', () => {
    const advancedResponse = `This wine exhibits exceptional terroir characteristics with pronounced phenolic compounds and malolactic fermentation notes.`
    const advancedGuidelines = { ...mockGuidelines, vocabularyLevel: 'advanced' as const }

    const result = ResponseValidator.validateResponse(advancedResponse, advancedGuidelines)

    // Advanced vocabulary should be appropriate for advanced users
    const hasComplexityMismatch = result.warnings.some(w => w.type === 'complexity_mismatch')
    expect(hasComplexityMismatch).toBe(false)
  })
})