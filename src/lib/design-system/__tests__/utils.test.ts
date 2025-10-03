import { describe, it, expect } from 'vitest'
import { cn, designSystem, colors, typography, breakpoints } from '../utils'

describe('Design System Utils', () => {
  describe('cn (className utility)', () => {
    it('merges classes correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-red-500')
      expect(result).toBe('px-4 py-2 bg-red-500')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('deduplicates Tailwind classes', () => {
      const result = cn('px-4 px-6', 'py-2 py-4')
      expect(result).toBe('px-6 py-4')
    })

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toBe('base end')
    })
  })

  describe('designSystem.validateNoEmojis', () => {
    it('returns true for text without emojis', () => {
      expect(designSystem.validateNoEmojis('Professional wine description')).toBe(true)
      expect(designSystem.validateNoEmojis('Château Margaux 2015')).toBe(true)
      expect(designSystem.validateNoEmojis('Excellent vintage from Bordeaux')).toBe(true)
    })

    it('returns false for text with emojis', () => {
      expect(designSystem.validateNoEmojis('Great wine! 🍷')).toBe(false)
      expect(designSystem.validateNoEmojis('Perfect pairing 😋')).toBe(false)
      expect(designSystem.validateNoEmojis('5 stars ⭐⭐⭐⭐⭐')).toBe(false)
    })

    it('handles various emoji types', () => {
      // Face emojis
      expect(designSystem.validateNoEmojis('Happy 😊')).toBe(false)
      // Object emojis
      expect(designSystem.validateNoEmojis('Wine 🍷')).toBe(false)
      // Symbol emojis
      expect(designSystem.validateNoEmojis('Star ⭐')).toBe(false)
      // Flag emojis
      expect(designSystem.validateNoEmojis('France 🇫🇷')).toBe(false)
    })
  })

  describe('designSystem.sanitizeText', () => {
    it('removes emojis from text', () => {
      expect(designSystem.sanitizeText('Great wine! 🍷')).toBe('Great wine!')
      expect(designSystem.sanitizeText('Perfect pairing 😋 with cheese')).toBe('Perfect pairing  with cheese')
    })

    it('trims whitespace after emoji removal', () => {
      expect(designSystem.sanitizeText('Wine 🍷 ')).toBe('Wine')
      expect(designSystem.sanitizeText(' 🍷 Excellent')).toBe('Excellent')
    })

    it('leaves clean text unchanged', () => {
      const cleanText = 'Professional wine description'
      expect(designSystem.sanitizeText(cleanText)).toBe(cleanText)
    })
  })

  describe('designSystem.validateProfessionalTone', () => {
    it('validates professional text', () => {
      const result = designSystem.validateProfessionalTone('This Bordeaux wine offers excellent structure and complexity.')
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('detects emoji violations', () => {
      const result = designSystem.validateProfessionalTone('Great wine! 🍷')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Contains emojis - violates professional design policy')
    })

    it('detects casual language patterns', () => {
      const result = designSystem.validateProfessionalTone('This wine is lol amazing!!!')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Contains casual abbreviations - not professional tone')
      expect(result.issues).toContain('Contains excessive exclamation - not professional tone')
    })

    it('detects multiple issues', () => {
      const result = designSystem.validateProfessionalTone('OMG this wine is amazing!!! 🍷')
      expect(result.isValid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(1)
    })

    it('handles edge cases', () => {
      expect(designSystem.validateProfessionalTone('').isValid).toBe(true)
      expect(designSystem.validateProfessionalTone('A').isValid).toBe(true)
      expect(designSystem.validateProfessionalTone('Professional. Clear. Concise.').isValid).toBe(true)
    })
  })

  describe('Professional Design Constants', () => {
    it('provides wine-inspired color palette', () => {
      expect(colors.wine).toBeDefined()
      expect(colors.burgundy).toBeDefined()
      expect(colors.gold).toBeDefined()
      
      // Check color structure
      expect(colors.wine[500]).toBe('#ec4899')
      expect(colors.burgundy[600]).toBe('#dc2626')
      expect(colors.gold[500]).toBe('#f59e0b')
    })

    it('provides consistent typography scale', () => {
      expect(typography.fontSizes).toBeDefined()
      expect(typography.fontWeights).toBeDefined()
      expect(typography.lineHeights).toBeDefined()
      
      // Check typography values
      expect(typography.fontSizes.base).toBe('1rem')
      expect(typography.fontWeights.medium).toBe('500')
      expect(typography.lineHeights.normal).toBe('1.5')
    })

    it('provides responsive breakpoints', () => {
      expect(breakpoints.xs).toBe('475px')
      expect(breakpoints.sm).toBe('640px')
      expect(breakpoints.md).toBe('768px')
      expect(breakpoints.lg).toBe('1024px')
    })
  })
})