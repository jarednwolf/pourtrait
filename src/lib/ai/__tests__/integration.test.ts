// AI System Integration Tests

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { AIRecommendationEngine } from '../recommendation-engine'
import { ResponseValidator } from '../validation'
import { ContextAnalyzer } from '../context-analyzer'
import { buildPromptTemplate } from '../config'

// Mock OpenAI and Pinecone for integration tests
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'I recommend a 2020 Sancerre from the Loire Valley. This Sauvignon Blanc pairs beautifully with grilled salmon because its crisp acidity and mineral notes complement the fish without overwhelming its delicate flavors.'
            }
          }],
          usage: {
            total_tokens: 120
          }
        })
      }
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      })
    }
  }))
}))

vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    listIndexes: vi.fn().mockResolvedValue({ indexes: [] }),
    createIndex: vi.fn().mockResolvedValue({}),
    index: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({}),
      query: vi.fn().mockResolvedValue({ matches: [] })
    })
  }))
}))

describe('AI System Integration', () => {
  let engine: AIRecommendationEngine

  beforeAll(() => {
    engine = new AIRecommendationEngine()
  })

  describe('End-to-End Workflow', () => {
    it('should process a complete recommendation request', async () => {
      const mockRequest = {
        userId: 'test-user',
        query: 'What wine should I drink with steak dinner?',
        context: {
          occasion: 'dinner party',
          foodPairing: 'grilled steak'
        },
        userProfile: {
          userId: 'test-user',
          redWinePreferences: {
            fruitiness: 7,
            earthiness: 5,
            oakiness: 6,
            acidity: 5,
            tannins: 7,
            sweetness: 2,
            body: 'full' as const,
            preferredRegions: ['Napa Valley'],
            preferredVarietals: ['Cabernet Sauvignon'],
            dislikedCharacteristics: []
          },
          whiteWinePreferences: {
            fruitiness: 6,
            earthiness: 4,
            oakiness: 5,
            acidity: 7,
            tannins: 2,
            sweetness: 3,
            body: 'medium' as const,
            preferredRegions: ['Burgundy'],
            preferredVarietals: ['Chardonnay'],
            dislikedCharacteristics: []
          },
          sparklingPreferences: {
            fruitiness: 5,
            earthiness: 3,
            oakiness: 2,
            acidity: 8,
            tannins: 1,
            sweetness: 4,
            body: 'light' as const,
            preferredRegions: ['Champagne'],
            preferredVarietals: ['Chardonnay'],
            dislikedCharacteristics: []
          },
          generalPreferences: {
            priceRange: { min: 25, max: 100, currency: 'USD' },
            occasionPreferences: ['dinner party'],
            foodPairingImportance: 8
          },
          learningHistory: [],
          confidenceScore: 0.8,
          lastUpdated: new Date()
        },
        experienceLevel: 'intermediate' as const
      }

      const response = await engine.generateRecommendations(mockRequest)

      // Verify response structure
      expect(response).toHaveProperty('recommendations')
      expect(response).toHaveProperty('reasoning')
      expect(response).toHaveProperty('confidence')
      expect(response).toHaveProperty('responseMetadata')

      // Verify response quality
      expect(response.confidence).toBeGreaterThan(0)
      expect(response.reasoning).toBeTruthy()
      expect(response.responseMetadata.validationPassed).toBe(true)
    })
  })

  describe('Component Integration', () => {
    it('should integrate context analysis with prompt generation', () => {
      const mockRequest = {
        userId: 'test-user',
        query: 'Wine for romantic dinner with salmon',
        context: {
          occasion: 'romantic dinner',
          foodPairing: 'grilled salmon'
        },
        userProfile: {
          redWinePreferences: {
            preferredRegions: ['Burgundy'],
            dislikedCharacteristics: []
          },
          whiteWinePreferences: {
            preferredRegions: ['Loire Valley'],
            dislikedCharacteristics: []
          },
          sparklingPreferences: {
            preferredRegions: ['Champagne'],
            dislikedCharacteristics: []
          },
          learningHistory: []
        } as any,
        experienceLevel: 'beginner' as const
      }

      const contextAnalysis = ContextAnalyzer.analyzeContext(mockRequest)
      const promptTemplate = buildPromptTemplate(
        'beginner',
        'pairing',
        contextAnalysis.occasion.type
      )

      expect(contextAnalysis.occasion.type).toBe('romantic_dinner')
      expect(contextAnalysis.foodPairing.mainDish).toBe('salmon')
      expect(promptTemplate.responseGuidelines.includeEducation).toBe(true)
      expect(promptTemplate.responseGuidelines.vocabularyLevel).toBe('accessible')
    })

    it('should validate AI responses according to professional standards', () => {
      const professionalResponse = `I recommend a 2020 Sancerre from the Loire Valley. This Sauvignon Blanc pairs beautifully with grilled salmon because its crisp acidity and mineral notes complement the fish without overwhelming its delicate flavors. The wine's citrus characteristics will enhance the salmon's natural richness.`

      const unprofessionalResponse = `OMG this wine is totally awesome! 🍷 You're gonna love it with your fish! 😊`

      const guidelines = {
        noEmojis: true as const,
        tone: 'professional_sommelier' as const,
        includeEducation: false,
        vocabularyLevel: 'intermediate' as const,
        maxLength: 1000
      }

      const professionalResult = ResponseValidator.validateResponse(professionalResponse, guidelines)
      const unprofessionalResult = ResponseValidator.validateResponse(unprofessionalResponse, guidelines)

      expect(professionalResult.passed).toBe(true)
      expect(professionalResult.score).toBeGreaterThan(80)

      expect(unprofessionalResult.passed).toBe(false)
      expect(unprofessionalResult.errors.some(e => e.type === 'emoji_detected')).toBe(true)
      expect(unprofessionalResult.errors.some(e => e.type === 'inappropriate_tone')).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should gracefully handle missing user profile data', async () => {
      const incompleteRequest = {
        userId: 'test-user',
        query: 'Recommend a wine',
        context: {},
        userProfile: {
          userId: 'test-user'
        } as any,
        experienceLevel: 'intermediate' as const
      }

      // Should not throw an error
      const response = await engine.generateRecommendations(incompleteRequest)
      expect(response).toBeDefined()
      expect(response.recommendations).toBeDefined()
    })

    it('should handle empty or invalid queries', async () => {
      const invalidRequest = {
        userId: 'test-user',
        query: '',
        context: {},
        userProfile: {
          userId: 'test-user',
          redWinePreferences: { dislikedCharacteristics: [] },
          whiteWinePreferences: { dislikedCharacteristics: [] },
          sparklingPreferences: { dislikedCharacteristics: [] },
          learningHistory: []
        } as any,
        experienceLevel: 'intermediate' as const
      }

      const response = await engine.generateRecommendations(invalidRequest)
      expect(response).toBeDefined()
      expect(response.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance and Quality Metrics', () => {
    it('should complete recommendations within reasonable time', async () => {
      const startTime = Date.now()

      const mockRequest = {
        userId: 'test-user',
        query: 'Quick wine recommendation for dinner',
        context: {},
        userProfile: {
          userId: 'test-user',
          redWinePreferences: { dislikedCharacteristics: [] },
          whiteWinePreferences: { dislikedCharacteristics: [] },
          sparklingPreferences: { dislikedCharacteristics: [] },
          learningHistory: []
        } as any,
        experienceLevel: 'intermediate' as const
      }

      const response = await engine.generateRecommendations(mockRequest)
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(response.responseMetadata.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('should maintain consistent quality across different experience levels', async () => {
      const baseRequest = {
        userId: 'test-user',
        query: 'Wine recommendation for steak dinner',
        context: { foodPairing: 'steak' },
        userProfile: {
          userId: 'test-user',
          redWinePreferences: { 
            preferredVarietals: ['Cabernet Sauvignon'],
            dislikedCharacteristics: [] 
          },
          whiteWinePreferences: { dislikedCharacteristics: [] },
          sparklingPreferences: { dislikedCharacteristics: [] },
          learningHistory: []
        } as any
      }

      const beginnerRequest = { ...baseRequest, experienceLevel: 'beginner' as const }
      const intermediateRequest = { ...baseRequest, experienceLevel: 'intermediate' as const }
      const advancedRequest = { ...baseRequest, experienceLevel: 'advanced' as const }

      const [beginnerResponse, intermediateResponse, advancedResponse] = await Promise.all([
        engine.generateRecommendations(beginnerRequest),
        engine.generateRecommendations(intermediateRequest),
        engine.generateRecommendations(advancedRequest)
      ])

      // All should have reasonable confidence
      expect(beginnerResponse.confidence).toBeGreaterThan(0.5)
      expect(intermediateResponse.confidence).toBeGreaterThan(0.5)
      expect(advancedResponse.confidence).toBeGreaterThan(0.5)

      // All should pass validation
      expect(beginnerResponse.responseMetadata.validationPassed).toBe(true)
      expect(intermediateResponse.responseMetadata.validationPassed).toBe(true)
      expect(advancedResponse.responseMetadata.validationPassed).toBe(true)
    })
  })
})