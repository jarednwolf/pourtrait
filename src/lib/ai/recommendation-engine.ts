// AI Recommendation Engine - Core Service

import { OpenAI } from 'openai'
import { 
  AIRecommendationRequest, 
  AIRecommendationResponse, 
  AIRecommendation,
  ResponseMetadata,
  AIMetrics
} from './types'
import { Wine } from '@/types'
import { AI_CONFIG, buildPromptTemplate } from './config'
import { ResponseValidator, ResponseEnhancer } from './validation'
import { ContextAnalyzer } from './context-analyzer'
import { AIServiceError, AIRateLimitError, AITimeoutError } from '../errors'
import { withRetry, retryConditions } from '../utils/retry'
import { AIServiceFallbacks } from '../utils/fallback'
import { aiLogger } from '../utils/logger'
import { performanceMonitor } from '../monitoring/performance'
// Conditional import for Edge Runtime compatibility
let VectorService: any = null

// Only import vector services in Node.js runtime
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  try {
    const vectorModule = require('./vector-service')
    VectorService = vectorModule.VectorService
  } catch (error) {
    console.warn('Vector service not available in this runtime:', error)
  }
}

// ============================================================================
// AI Recommendation Engine
// ============================================================================

export class AIRecommendationEngine {
  private openai: OpenAI
  private vectorService: any

  constructor() {
    this.openai = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey
    })
    
    // Initialize vector services only if available
    if (VectorService) {
      this.vectorService = new VectorService()
    } else {
      this.vectorService = null
    }
  }

  /**
   * Generate AI-powered wine recommendations
   */
  async generateRecommendations(request: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    const startTime = performance.now()
    let tokensUsed = 0

    aiLogger.info('Starting AI recommendation generation', {
      userId: request.userId,
      query: request.query,
      experienceLevel: request.experienceLevel
    });

    try {
      // Analyze context
      const contextAnalysis = ContextAnalyzer.analyzeContext(request)

      // Generate RAG context (fallback if vector service unavailable)
      let ragContext
      if (this.vectorService) {
        ragContext = await this.vectorService.generateRAGContext(
          request.query,
          request.userProfile,
          request.inventory
        )
      } else {
        // Fallback RAG context for Edge Runtime
        ragContext = {
          wineKnowledge: [],
          userHistory: { recentQueries: [], preferenceEvolution: [], feedbackHistory: [] },
          similarUsers: [],
          expertOpinions: []
        }
      }

      // Build prompt template
      const promptTemplate = buildPromptTemplate(
        request.experienceLevel,
        this.determineRecommendationType(request),
        contextAnalysis.occasion.type
      )

      // Generate AI response with retry logic
      const aiResponse = await withRetry(
        () => this.generateAIResponse(request, contextAnalysis, ragContext, promptTemplate),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          retryCondition: retryConditions.networkErrors,
          onRetry: (attempt, error) => {
            aiLogger.warn(`AI request retry attempt ${attempt}`, { error: error.message });
          }
        }
      );

      if (!aiResponse.success) {
        throw new AIServiceError(
          aiResponse.error?.message || 'AI service failed',
          "I'm having trouble generating recommendations right now. Please try again in a moment."
        );
      }

      tokensUsed = aiResponse.result?.tokensUsed || 0

      // Validate response
      const validation = ResponseValidator.comprehensiveValidation(
        aiResponse.result?.content || '',
        promptTemplate.responseGuidelines
      )

      // Enhance response if needed
      let enhancedResponse = aiResponse.result?.content || ''
      if (validation.passed) {
        enhancedResponse = ResponseEnhancer.enhanceResponse(
          aiResponse.result?.content || '',
          promptTemplate.responseGuidelines
        )
      }

      // Parse recommendations from response
      const recommendations = await this.parseRecommendations(
        enhancedResponse,
        request,
        contextAnalysis
      )

      // Calculate confidence
      const confidence = this.calculateOverallConfidence(recommendations, validation.score)

      // Generate response metadata
      const responseTime = performance.now() - startTime;
      const responseMetadata: ResponseMetadata = {
        model: AI_CONFIG.openai.model,
        tokensUsed,
        responseTime,
        validationPassed: validation.passed,
        validationErrors: validation.errors.map(e => e.message),
        confidence
      }

      // Track performance
      performanceMonitor.trackAIOperation('recommendation_generation', startTime);

      // Log metrics
      await this.logMetrics({
        requestId: this.generateRequestId(),
        userId: request.userId,
        timestamp: new Date(),
        model: AI_CONFIG.openai.model,
        tokensUsed,
        responseTime,
        cost: this.calculateCost(tokensUsed),
        confidence,
        validationScore: validation.score
      });

      aiLogger.info('AI recommendation generation completed', {
        userId: request.userId,
        tokensUsed,
        responseTime,
        confidence,
        recommendationCount: recommendations.length
      });

      return {
        recommendations,
        reasoning: this.extractReasoning(enhancedResponse),
        confidence,
        educationalNotes: this.extractEducationalNotes(enhancedResponse, request.experienceLevel),
        followUpQuestions: this.generateFollowUpQuestions(request, contextAnalysis),
        responseMetadata
      }

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      aiLogger.error('Error generating AI recommendations', {
        userId: request.userId,
        query: request.query,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new AIRateLimitError(60, { userId: request.userId, operation: 'recommendation_generation' });
        }
        
        if (error.message.includes('timeout')) {
          throw new AITimeoutError({ userId: request.userId, operation: 'recommendation_generation' });
        }
      }
      
      // Return fallback response for other errors
      return this.generateFallbackResponse(request, responseTime);
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    request: AIRecommendationRequest,
    contextAnalysis: any,
    ragContext: any,
    promptTemplate: any
  ): Promise<{ content: string; tokensUsed: number }> {
    
    const userPrompt = this.buildUserPrompt(request, contextAnalysis, ragContext);

    try {
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: [
          { role: 'system', content: promptTemplate.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: AI_CONFIG.openai.temperature,
        max_tokens: AI_CONFIG.openai.maxTokens
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError(
          'Empty response from AI service',
          "I couldn't generate a proper response. Please try rephrasing your question."
        );
      }

      return {
        content,
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (error) {
      if (error instanceof Error) {
        // Handle OpenAI specific errors
        if (error.message.includes('rate_limit_exceeded')) {
          throw new AIRateLimitError();
        }
        
        if (error.message.includes('timeout')) {
          throw new AITimeoutError();
        }
        
        if (error.message.includes('insufficient_quota')) {
          throw new AIServiceError(
            'AI service quota exceeded',
            "I'm temporarily unavailable due to high demand. Please try again later."
          );
        }
      }
      
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown AI service error',
        "I'm having trouble processing your request. Please try again."
      );
    }
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(
    request: AIRecommendationRequest,
    _contextAnalysis: any,
    ragContext: any
  ): string {
    let prompt = `User Query: "${request.query}"\n\n`

    // Add user profile context
    prompt += `User Experience Level: ${request.experienceLevel}\n`
    prompt += `User Taste Profile:\n`
    prompt += `- Red Wine Preferences: ${this.formatFlavorProfile(request.userProfile.redWinePreferences)}\n`
    prompt += `- White Wine Preferences: ${this.formatFlavorProfile(request.userProfile.whiteWinePreferences)}\n`
    prompt += `- General Preferences: ${this.formatGeneralPreferences(request.userProfile.generalPreferences)}\n\n`

    // Add context information
    if (request.context.occasion) {
      prompt += `Occasion: ${request.context.occasion}\n`
    }
    if (request.context.foodPairing) {
      prompt += `Food Pairing: ${request.context.foodPairing}\n`
    }
    if (request.context.priceRange) {
      prompt += `Price Range: $${request.context.priceRange.min}-${request.context.priceRange.max} ${request.context.priceRange.currency}\n`
    }

    // Add inventory context if available
    if (request.inventory && request.inventory.length > 0) {
      prompt += `\nUser's Wine Inventory:\n`
      request.inventory.slice(0, 10).forEach(wine => {
        prompt += `- ${wine.name} (${wine.producer}) - ${wine.vintage} ${wine.type} from ${wine.region}\n`
        prompt += `  Status: ${wine.drinkingWindow.currentStatus}, Quantity: ${wine.quantity}\n`
      })
    }

    // Add RAG context
    if (ragContext.wineKnowledge.length > 0) {
      prompt += `\nRelevant Wine Knowledge:\n`
      ragContext.wineKnowledge.slice(0, 3).forEach((knowledge: any) => {
        prompt += `- ${knowledge.content}\n`
      })
    }

    prompt += `\nPlease provide specific wine recommendations with detailed reasoning appropriate for a ${request.experienceLevel} wine enthusiast.`

    return prompt
  }

  /**
   * Parse recommendations from AI response
   */
  private async parseRecommendations(
    response: string,
    request: AIRecommendationRequest,
    _contextAnalysis: any
  ): Promise<AIRecommendation[]> {
    // This is a simplified parser - in production, you might use more sophisticated NLP
    const recommendations: AIRecommendation[] = []

    // Look for wine mentions in the response
    const wineMatches = response.match(/([A-Z][a-zA-Z\s&]+(?:Winery|Vineyard|Estate|Cellars?)?)\s+([12][0-9]{3})?\s*(Cabernet|Chardonnay|Pinot|Merlot|Sauvignon|Riesling|[A-Z][a-z]+)/gi)

    if (wineMatches) {
      for (const match of wineMatches.slice(0, 3)) { // Limit to 3 recommendations
        const recommendation: AIRecommendation = {
          type: request.inventory && request.inventory.length > 0 ? 'inventory' : 'purchase',
          reasoning: this.extractReasoningForWine(response, match),
          confidence: 0.8, // Default confidence
          educationalContext: request.experienceLevel === 'beginner' ? 
            this.generateEducationalContext(match) : undefined
        }

        // Try to match with inventory
        if (request.inventory) {
          const inventoryMatch = this.findInventoryMatch(match, request.inventory)
          if (inventoryMatch) {
            recommendation.wineId = inventoryMatch.id
            recommendation.type = 'inventory'
          }
        }

        // If not in inventory, create purchase suggestion
        if (!recommendation.wineId) {
          recommendation.suggestedWine = this.parseWineSuggestion(match)
          recommendation.type = 'purchase'
        }

        recommendations.push(recommendation)
      }
    }

    return recommendations
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private determineRecommendationType(request: AIRecommendationRequest): 'inventory' | 'purchase' | 'pairing' | 'restaurant' {
    if (request.context.foodPairing) return 'pairing'
    if (request.inventory && request.inventory.length > 0) return 'inventory'
    return 'purchase'
  }

  private formatFlavorProfile(profile: any): string {
    if (!profile) return 'No preferences specified'
    return `Body: ${profile.body || 'unspecified'}, Fruitiness: ${profile.fruitiness || 0}/10, Earthiness: ${profile.earthiness || 0}/10`
  }

  private formatGeneralPreferences(preferences: any): string {
    if (!preferences || !preferences.priceRange) return 'No price preferences specified'
    return `Price Range: $${preferences.priceRange?.min || 0}-${preferences.priceRange?.max || 0}`
  }

  private extractReasoning(response: string): string {
    // Extract the main reasoning from the response
    const sentences = response.split('.')
    const reasoningSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes('because') || 
      sentence.toLowerCase().includes('pairs well') ||
      sentence.toLowerCase().includes('recommend')
    )
    
    return reasoningSentences.slice(0, 2).join('. ') + '.'
  }

  private extractEducationalNotes(response: string, experienceLevel: string): string | undefined {
    if (experienceLevel !== 'beginner') return undefined
    
    // Extract educational content for beginners
    const educationalSentences = response.split('.').filter(sentence =>
      sentence.toLowerCase().includes('learn') ||
      sentence.toLowerCase().includes('note that') ||
      sentence.toLowerCase().includes('tip:')
    )
    
    return educationalSentences.length > 0 ? educationalSentences.join('. ') + '.' : undefined
  }

  private generateFollowUpQuestions(request: AIRecommendationRequest, _contextAnalysis: any): string[] {
    const questions: string[] = []
    
    if (!request.context.foodPairing) {
      questions.push("What food will you be pairing this wine with?")
    }
    
    if (!request.context.occasion) {
      questions.push("What's the occasion for this wine?")
    }
    
    if (request.experienceLevel === 'beginner') {
      questions.push("Would you like me to explain any wine terms or concepts?")
    }
    
    return questions.slice(0, 2) // Limit to 2 questions
  }

  private extractReasoningForWine(response: string, _wineMatch: string): string {
    // Find sentences that mention this specific wine
    const sentences = response.split('.')
    const relevantSentences = sentences.filter(sentence => 
      sentence.includes(_wineMatch.split(' ')[0]) // Match on first word (producer)
    )
    
    return relevantSentences.length > 0 ? relevantSentences[0].trim() + '.' : 'Recommended based on your preferences.'
  }

  private generateEducationalContext(_wineMatch: string): string {
    // Generate basic educational context for beginners
    return `This wine represents a classic example of its style and region, making it an excellent choice for learning about wine characteristics.`
  }

  private findInventoryMatch(wineMatch: string, inventory: Wine[]): Wine | undefined {
    const matchWords = wineMatch.toLowerCase().split(' ')
    return inventory.find(wine => 
      matchWords.some(word => 
        wine.name.toLowerCase().includes(word) || 
        wine.producer.toLowerCase().includes(word)
      )
    )
  }

  private parseWineSuggestion(wineMatch: string): any {
    // Parse wine suggestion from AI response
    const parts = wineMatch.split(' ')
    return {
      name: parts.slice(0, -1).join(' '),
      producer: parts[0],
      region: 'Various', // Would need more sophisticated parsing
      varietal: [parts[parts.length - 1]],
      type: this.inferWineType(parts[parts.length - 1])
    }
  }

  private inferWineType(varietal: string): 'red' | 'white' | 'rosé' | 'sparkling' {
    const redVarietals = ['cabernet', 'merlot', 'pinot noir', 'syrah', 'shiraz']
    const whiteVarietals = ['chardonnay', 'sauvignon blanc', 'riesling', 'pinot grigio']
    
    const lowerVarietal = varietal.toLowerCase()
    if (redVarietals.some(v => lowerVarietal.includes(v))) return 'red'
    if (whiteVarietals.some(v => lowerVarietal.includes(v))) return 'white'
    return 'red' // Default
  }

  private calculateOverallConfidence(recommendations: AIRecommendation[], validationScore: number): number {
    if (recommendations.length === 0) return 0
    
    const avgRecommendationConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length
    return Math.round((avgRecommendationConfidence * 0.7 + validationScore * 0.003) * 100) / 100
  }

  private calculateCost(tokensUsed: number): number {
    const costs = AI_CONFIG.openai.model.includes('gpt-4') ? 
      { input: 0.01, output: 0.03 } : 
      { input: 0.0015, output: 0.002 }
    
    // Rough estimate assuming 70% input, 30% output
    return (tokensUsed * 0.7 * costs.input + tokensUsed * 0.3 * costs.output) / 1000
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async logMetrics(metrics: AIMetrics): Promise<void> {
    // In production, this would log to a monitoring service
    console.log('AI Metrics:', metrics)
  }

  private generateFallbackResponse(request: AIRecommendationRequest, responseTime: number): AIRecommendationResponse {
    const fallback = AIServiceFallbacks.getRecommendationFallback(request.userProfile);
    
    return {
      recommendations: fallback.recommendations.map(rec => ({
        type: rec.type as 'inventory' | 'purchase',
        reasoning: rec.description,
        confidence: rec.confidence,
        educationalContext: request.experienceLevel === 'beginner' ? 
          'While I work on getting back online, these suggestions can help you explore wine.' : undefined
      })),
      reasoning: fallback.message,
      confidence: 0.6,
      responseMetadata: {
        model: AI_CONFIG.openai.model,
        tokensUsed: 0,
        responseTime,
        validationPassed: false,
        validationErrors: ['Service unavailable - using fallback'],
        confidence: 0.6
      }
    };
  }
}