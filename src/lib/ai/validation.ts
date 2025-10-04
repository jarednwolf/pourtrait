// AI Response Validation Service

import { ValidationResult, ValidationError, ValidationWarning, ResponseGuidelines } from './types'
import { VALIDATION_PATTERNS } from './config'

// ============================================================================
// Response Validation Service
// ============================================================================

export class ResponseValidator {
  /**
   * Validates an AI response against professional sommelier standards
   */
  static validateResponse(
    response: string,
    guidelines: ResponseGuidelines
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let score = 100

    // Check for emojis (critical requirement)
    const emojiCheck = this.checkForEmojis(response)
    if (!emojiCheck.passed) {
      errors.push({
        type: 'emoji_detected',
        message: `Emojis detected: ${emojiCheck.emojis.join(', ')}`,
        severity: 'high',
        location: 'response_content'
      })
      score -= 50 // Major penalty for emojis
    }

    // Check professional tone
    const toneCheck = this.checkProfessionalTone(response)
    if (!toneCheck.passed) {
      errors.push({
        type: 'inappropriate_tone',
        message: `Unprofessional language detected: ${toneCheck.issues.join(', ')}`,
        severity: 'medium'
      })
      score -= 20
    }

    // Check response length
    const lengthCheck = this.checkResponseLength(response, guidelines.maxLength)
    if (!lengthCheck.passed) {
      errors.push({
        type: 'length_exceeded',
        message: `Response too long: ${response.length} characters (max: ${guidelines.maxLength})`,
        severity: 'low'
      })
      score -= 10
    }

    // Check vocabulary level appropriateness
    const vocabularyCheck = this.checkVocabularyLevel(response, guidelines.vocabularyLevel)
    if (!vocabularyCheck.appropriate) {
      warnings.push({
        type: 'complexity_mismatch',
        message: vocabularyCheck.message,
        suggestion: vocabularyCheck.suggestion
      })
      score -= 5
    }

    // Check for required elements
    const completenessCheck = this.checkCompleteness(response)
    if (!completenessCheck.passed) {
      warnings.push({
        type: 'incomplete_reasoning',
        message: `Missing elements: ${completenessCheck.missing.join(', ')}`,
        suggestion: 'Ensure all recommendations include reasoning and specific wine details'
      })
      score -= 10
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    }
  }

  /**
   * Checks for emoji usage in response
   */
  private static checkForEmojis(response: string): { passed: boolean; emojis: string[] } {
    const emojiMatches = response.match(VALIDATION_PATTERNS.emojiRegex) || []
    return {
      passed: emojiMatches.length === 0,
      emojis: [...new Set(emojiMatches)] // Remove duplicates
    }
  }

  /**
   * Checks for professional sommelier tone
   */
  private static checkProfessionalTone(response: string): { passed: boolean; issues: string[] } {
    const lowerResponse = response.toLowerCase()
    const issues: string[] = []

    // Check for unprofessional language
    VALIDATION_PATTERNS.unprofessionalIndicators.forEach(indicator => {
      if (lowerResponse.includes(indicator.toLowerCase())) {
        issues.push(indicator)
      }
    })

    // Check for professional indicators (should have at least some)
    const professionalCount = VALIDATION_PATTERNS.professionalIndicators.filter(indicator =>
      lowerResponse.includes(indicator.toLowerCase())
    ).length

    if (professionalCount === 0) {
      issues.push('lacks professional sommelier vocabulary')
    }

    return {
      passed: issues.length === 0,
      issues
    }
  }

  /**
   * Checks response length against guidelines
   */
  private static checkResponseLength(response: string, maxLength: number): { passed: boolean } {
    return {
      passed: response.length <= maxLength
    }
  }

  /**
   * Checks vocabulary level appropriateness
   */
  private static checkVocabularyLevel(
    response: string,
    targetLevel: 'accessible' | 'intermediate' | 'advanced'
  ): { appropriate: boolean; message: string; suggestion?: string } {
    const complexTerms = [
      'terroir', 'malolactic', 'phenolic', 'tannin structure', 'minerality',
      'brettanomyces', 'sur lie', 'batonnage', 'assemblage', 'cuvée'
    ]

    const technicalTerms = [
      'acidity', 'tannins', 'body', 'finish', 'vintage', 'varietal',
      'appellation', 'oak aging', 'decanting', 'aerating'
    ]

    const complexTermCount = complexTerms.filter(term =>
      response.toLowerCase().includes(term.toLowerCase())
    ).length

    const technicalTermCount = technicalTerms.filter(term =>
      response.toLowerCase().includes(term.toLowerCase())
    ).length

    switch (targetLevel) {
      case 'accessible':
        if (complexTermCount > 1) {
          return {
            appropriate: false,
            message: 'Too many complex wine terms for beginner level',
            suggestion: 'Use simpler language and explain technical terms when necessary'
          }
        }
        break

      case 'intermediate':
        if (complexTermCount > 3) {
          return {
            appropriate: false,
            message: 'Vocabulary too advanced for intermediate level',
            suggestion: 'Reduce complex terminology or provide brief explanations'
          }
        }
        if (technicalTermCount === 0) {
          return {
            appropriate: false,
            message: 'Response lacks appropriate wine terminology for intermediate level',
            suggestion: 'Include some wine terminology with brief context'
          }
        }
        break

      case 'advanced':
        if (technicalTermCount < 2 && complexTermCount === 0) {
          return {
            appropriate: false,
            message: 'Vocabulary too simple for advanced level',
            suggestion: 'Use more sophisticated wine terminology and technical details'
          }
        }
        break
    }

    return { appropriate: true, message: 'Vocabulary level appropriate' }
  }

  /**
   * Checks for completeness of recommendation
   */
  private static checkCompleteness(response: string): { passed: boolean; missing: string[] } {
    const missing: string[] = []
    const lowerResponse = response.toLowerCase()

    // Check for reasoning
    const reasoningIndicators = ['because', 'since', 'due to', 'reason', 'pairs well', 'complements']
    if (!reasoningIndicators.some(indicator => lowerResponse.includes(indicator))) {
      missing.push('reasoning explanation')
    }

    // Check for specific wine details
    if (!lowerResponse.includes('wine') && !lowerResponse.includes('bottle')) {
      missing.push('specific wine reference')
    }

    // Check for producer or region
    const locationIndicators = ['from', 'producer', 'winery', 'region', 'valley', 'appellation']
    if (!locationIndicators.some(indicator => lowerResponse.includes(indicator))) {
      missing.push('producer or region information')
    }

    return {
      passed: missing.length === 0,
      missing
    }
  }

  /**
   * Validates response against factual wine knowledge
   */
  static validateFactualAccuracy(response: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let score = 100

    // Check for common wine misconceptions
    const misconceptions = [
      { text: 'red wine with fish', severity: 'medium' as const },
      { text: 'white wine must be chilled to freezing', severity: 'low' as const },
      { text: 'expensive wine is always better', severity: 'medium' as const },
      { text: 'wine gets better indefinitely with age', severity: 'medium' as const }
    ]

    misconceptions.forEach(misconception => {
      if (response.toLowerCase().includes(misconception.text)) {
        errors.push({
          type: 'factual_error',
          message: `Potential misconception detected: ${misconception.text}`,
          severity: misconception.severity
        })
        score -= misconception.severity === 'medium' ? 15 : 5
      }
    })

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    }
  }

  /**
   * Comprehensive validation combining all checks
   */
  static comprehensiveValidation(
    response: string,
    guidelines: ResponseGuidelines
  ): ValidationResult {
    const styleValidation = this.validateResponse(response, guidelines)
    const factualValidation = this.validateFactualAccuracy(response)

    return {
      passed: styleValidation.passed && factualValidation.passed,
      errors: [...styleValidation.errors, ...factualValidation.errors],
      warnings: [...styleValidation.warnings, ...factualValidation.warnings],
      score: Math.round((styleValidation.score + factualValidation.score) / 2)
    }
  }
}

// ============================================================================
// Response Enhancement Utilities
// ============================================================================

export class ResponseEnhancer {
  /**
   * Enhances response with proper formatting and structure
   */
  static enhanceResponse(response: string, guidelines: ResponseGuidelines): string {
    let enhanced = response

    // Remove any emojis that might have slipped through
    enhanced = enhanced.replace(VALIDATION_PATTERNS.emojiRegex, '')

    // Ensure proper paragraph structure
    enhanced = this.improveFormatting(enhanced)

    // Add educational context if needed for beginners
    if (guidelines.includeEducation) {
      enhanced = this.addEducationalContext(enhanced)
    }

    // Ensure professional closing
    enhanced = this.ensureProfessionalClosing(enhanced)

    return enhanced.trim()
  }

  /**
   * Improves response formatting and structure
   */
  private static improveFormatting(response: string): string {
    // Ensure proper spacing after periods
    let formatted = response.replace(/\.([A-Z])/g, '. $1')

    // Ensure proper paragraph breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n')

    // Capitalize first letter of sentences
    formatted = formatted.replace(/(^|\. )([a-z])/g, (_match, prefix, letter) => 
      prefix + letter.toUpperCase()
    )

    return formatted
  }

  /**
   * Adds educational context for beginner users
   */
  private static addEducationalContext(response: string): string {
    // This would add brief explanations for wine terms
    // For now, return as-is but could be enhanced with a wine term dictionary
    return response
  }

  /**
   * Ensures professional closing to responses
   */
  private static ensureProfessionalClosing(response: string): string {
    const professionalClosings = [
      'Enjoy your wine selection!',
      'I hope this helps with your wine choice.',
      'Please let me know if you need any additional recommendations.',
      'Feel free to ask if you have any questions about these suggestions.'
    ]

    // Check if response already has a professional closing
    const hasClosing = professionalClosings.some(closing => 
      response.toLowerCase().includes(closing.toLowerCase().slice(0, 10))
    )

    if (!hasClosing && !response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
      response += '. I hope this helps with your wine selection!'
    }

    return response
  }
}