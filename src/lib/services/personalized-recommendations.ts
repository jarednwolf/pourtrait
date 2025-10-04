// Personalized Wine Recommendations Service
// Implements intelligent recommendation logic for inventory and purchase suggestions

import { Wine, TasteProfile, RecommendationContext, Recommendation, ConsumptionRecord } from '@/types'
import { AIRecommendationEngine } from '@/lib/ai/recommendation-engine'
import { AIRecommendationRequest } from '@/lib/ai/types'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Core Recommendation Service
// ============================================================================

export interface PersonalizedRecommendationRequest {
  userId: string
  type: 'tonight' | 'purchase' | 'contextual'
  context?: RecommendationContext
  inventory?: Wine[]
  tasteProfile?: TasteProfile
  consumptionHistory?: ConsumptionRecord[]
}

export interface PersonalizedRecommendationResponse {
  recommendations: EnhancedRecommendation[]
  reasoning: string
  confidence: number
  alternativeOptions?: EnhancedRecommendation[]
  educationalNotes?: string
  followUpQuestions?: string[]
}

export interface EnhancedRecommendation extends Recommendation {
  urgencyScore: number
  personalizedReasoning: string
  servingRecommendations?: ServingRecommendations
  pairingNotes?: string
  learningOpportunity?: string
  drinkingWindowAlert?: DrinkingWindowAlert
}

export interface ServingRecommendations {
  temperature?: {
    celsius: number
    fahrenheit: number
  }
  decantingTime?: number
  glassType?: string
  servingSize?: string
  optimalTiming?: string
}

export interface DrinkingWindowAlert {
  status: 'entering_peak' | 'at_peak' | 'leaving_peak' | 'urgent'
  message: string
  daysRemaining?: number
}

export class PersonalizedRecommendationService {
  private aiEngine: AIRecommendationEngine
  private supabase: any

  constructor() {
    this.aiEngine = new AIRecommendationEngine()
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Generate personalized recommendations based on request type
   */
  async generateRecommendations(
    request: PersonalizedRecommendationRequest
  ): Promise<PersonalizedRecommendationResponse> {
    try {
      // Get user data if not provided
      const userData = await this.getUserData(request.userId, request)

      // Generate recommendations based on type
      switch (request.type) {
        case 'tonight':
          return await this.generateTonightRecommendations(userData)
        case 'purchase':
          return await this.generatePurchaseRecommendations(userData)
        case 'contextual':
          return await this.generateContextualRecommendations(userData)
        default:
          throw new Error(`Unknown recommendation type: ${request.type}`)
      }
    } catch (error) {
      console.error('Error generating personalized recommendations:', error)
      throw error
    }
  }

  /**
   * Generate "What to drink tonight" recommendations
   */
  private async generateTonightRecommendations(
    userData: UserRecommendationData
  ): Promise<PersonalizedRecommendationResponse> {
    const { inventory, tasteProfile, consumptionHistory, context } = userData

    // Filter available wines (quantity > 0)
    const availableWines = inventory.filter(wine => wine.quantity > 0)

    if (availableWines.length === 0) {
      return this.generateEmptyInventoryResponse()
    }

    // Calculate urgency scores for drinking window priorities
    const winesWithUrgency = availableWines.map(wine => ({
      wine,
      urgencyScore: this.calculateUrgencyScore(wine),
      personalizedScore: this.calculatePersonalizedScore(wine, tasteProfile, consumptionHistory)
    }))

    // Sort by combined urgency and personalization scores
    winesWithUrgency.sort((a, b) => {
      const scoreA = a.urgencyScore * 0.6 + a.personalizedScore * 0.4
      const scoreB = b.urgencyScore * 0.6 + b.personalizedScore * 0.4
      return scoreB - scoreA
    })

    // Get top recommendations
    const topWines = winesWithUrgency.slice(0, 3)

    // Generate AI-enhanced reasoning
    const aiRequest: AIRecommendationRequest = {
      userId: userData.userId,
      query: this.buildTonightQuery(context),
      context: context || {},
      userProfile: tasteProfile,
      inventory: topWines.map(w => w.wine),
      experienceLevel: 'intermediate' // Default fallback
    }

    const aiResponse = await this.aiEngine.generateRecommendations(aiRequest)

    // Enhance recommendations with personalized data
    const enhancedRecommendations = await Promise.all(
      topWines.map(async (wineData, index) => {
        const aiRec = aiResponse.recommendations[index]
        return await this.enhanceRecommendation(
          wineData.wine,
          wineData.urgencyScore,
          aiRec,
          tasteProfile,
          context
        )
      })
    )

    return {
      recommendations: enhancedRecommendations,
      reasoning: this.buildTonightReasoning(topWines, context),
      confidence: this.calculateOverallConfidence(enhancedRecommendations),
      alternativeOptions: enhancedRecommendations.slice(1),
      educationalNotes: aiResponse.educationalNotes,
      followUpQuestions: this.generateTonightFollowUpQuestions(context)
    }
  }

  /**
   * Generate new wine purchase recommendations
   */
  private async generatePurchaseRecommendations(
    userData: UserRecommendationData
  ): Promise<PersonalizedRecommendationResponse> {
    const { tasteProfile, consumptionHistory, context, inventory } = userData

    // Analyze taste profile gaps and preferences
    const gapAnalysis = this.analyzeTasteProfileGaps(tasteProfile, consumptionHistory, inventory)

    // Generate AI recommendations for purchase
    const aiRequest: AIRecommendationRequest = {
      userId: userData.userId,
      query: this.buildPurchaseQuery(gapAnalysis, context),
      context: context || {},
      userProfile: tasteProfile,
      inventory: [], // Don't include inventory for purchase recommendations
      experienceLevel: 'intermediate' // Default fallback
    }

    const aiResponse = await this.aiEngine.generateRecommendations(aiRequest)

    // Enhance with purchase-specific data
    const enhancedRecommendations = await Promise.all(
      aiResponse.recommendations.map(async (rec) => {
        return await this.enhancePurchaseRecommendation(
          rec,
          gapAnalysis,
          tasteProfile,
          context
        )
      })
    )

    return {
      recommendations: enhancedRecommendations,
      reasoning: this.buildPurchaseReasoning(gapAnalysis, context),
      confidence: aiResponse.confidence,
      educationalNotes: aiResponse.educationalNotes,
      followUpQuestions: this.generatePurchaseFollowUpQuestions(gapAnalysis, context)
    }
  }

  /**
   * Generate contextual recommendations based on specific context
   */
  private async generateContextualRecommendations(
    userData: UserRecommendationData
  ): Promise<PersonalizedRecommendationResponse> {
    const { inventory, tasteProfile, context } = userData

    if (!context) {
      throw new Error('Context is required for contextual recommendations')
    }

    // Filter wines based on context
    const contextualWines = this.filterWinesByContext(inventory, context)

    // Generate AI recommendations with context
    const aiRequest: AIRecommendationRequest = {
      userId: userData.userId,
      query: this.buildContextualQuery(context),
      context,
      userProfile: tasteProfile,
      inventory: contextualWines,
      experienceLevel: 'intermediate' // Default fallback
    }

    const aiResponse = await this.aiEngine.generateRecommendations(aiRequest)

    // Enhance with contextual data
    const enhancedRecommendations = await Promise.all(
      aiResponse.recommendations.map(async (rec) => {
        const wine = contextualWines.find(w => w.id === rec.wineId)
        if (wine) {
          return await this.enhanceContextualRecommendation(
            wine,
            rec,
            context,
            tasteProfile
          )
        }
        return rec as EnhancedRecommendation
      })
    )

    return {
      recommendations: enhancedRecommendations,
      reasoning: aiResponse.reasoning,
      confidence: aiResponse.confidence,
      educationalNotes: aiResponse.educationalNotes,
      followUpQuestions: aiResponse.followUpQuestions
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getUserData(
    userId: string,
    request: PersonalizedRecommendationRequest
  ): Promise<UserRecommendationData> {
    // Use provided data or fetch from database
    const inventory = request.inventory || await this.getUserInventory(userId)
    const tasteProfile = request.tasteProfile || await this.getUserTasteProfile(userId)
    const consumptionHistory = request.consumptionHistory || await this.getUserConsumptionHistory(userId)

    return {
      userId,
      inventory,
      tasteProfile,
      consumptionHistory,
      context: request.context
    }
  }

  private async getUserInventory(userId: string): Promise<Wine[]> {
    const { data, error } = await this.supabase
      .from('wines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  private async getUserTasteProfile(userId: string): Promise<TasteProfile> {
    const { data, error } = await this.supabase
      .from('taste_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  private async getUserConsumptionHistory(userId: string): Promise<ConsumptionRecord[]> {
    const { data, error } = await this.supabase
      .from('consumption_history')
      .select('*')
      .eq('user_id', userId)
      .order('consumed_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  }

  private calculateUrgencyScore(wine: Wine): number {
    const now = new Date()
    const status = wine.drinkingWindow.currentStatus

    // Base urgency scores by drinking window status
    const baseScores = {
      'too_young': 0.1,
      'ready': 0.6,
      'peak': 0.9,
      'declining': 0.8,
      'over_hill': 0.3
    }

    let urgencyScore = baseScores[status] || 0.5

    // Increase urgency if approaching end of peak or declining
    if (status === 'peak' || status === 'declining') {
      const latest = new Date(wine.drinkingWindow.latestDate)
      const daysToEnd = Math.ceil((latest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysToEnd <= 365) { // Less than a year remaining
        urgencyScore += 0.1
      }
      if (daysToEnd <= 180) { // Less than 6 months
        urgencyScore += 0.1
      }
      if (daysToEnd <= 90) { // Less than 3 months
        urgencyScore += 0.2
      }
    }

    return Math.min(urgencyScore, 1.0)
  }

  private calculatePersonalizedScore(
    wine: Wine,
    tasteProfile: TasteProfile,
    consumptionHistory: ConsumptionRecord[]
  ): number {
    let score = 0.5 // Base score

    // Get relevant flavor profile based on wine type
    const flavorProfile = wine.type === 'red' 
      ? tasteProfile.redWinePreferences
      : wine.type === 'white'
      ? tasteProfile.whiteWinePreferences
      : tasteProfile.sparklingPreferences

    // Check preferred regions
    if (flavorProfile.preferredRegions.includes(wine.region)) {
      score += 0.2
    }

    // Check preferred varietals
    const hasPreferredVarietal = wine.varietal.some(v => 
      flavorProfile.preferredVarietals.includes(v)
    )
    if (hasPreferredVarietal) {
      score += 0.2
    }

    // Check recent consumption patterns
    const recentConsumption = consumptionHistory
      .filter(c => c.wineId === wine.id)
      .slice(0, 3)

    if (recentConsumption.length > 0) {
      const avgRating = recentConsumption.reduce((sum, c) => sum + (c.rating || 5), 0) / recentConsumption.length
      score += (avgRating - 5) * 0.1 // Adjust based on past ratings
    }

    return Math.min(Math.max(score, 0), 1)
  }

  private buildTonightQuery(context?: RecommendationContext): string {
    let query = "What wine should I drink tonight from my inventory?"

    if (context?.occasion) {
      query += ` The occasion is ${context.occasion}.`
    }
    if (context?.foodPairing) {
      query += ` I'll be having ${context.foodPairing}.`
    }
    if (context?.timeOfDay) {
      query += ` It's ${context.timeOfDay}.`
    }

    return query
  }

  private buildPurchaseQuery(gapAnalysis: TasteProfileGapAnalysis, context?: RecommendationContext): string {
    let query = "What wines should I buy to expand my collection?"

    if (gapAnalysis.missingRegions.length > 0) {
      query += ` I'm missing wines from ${gapAnalysis.missingRegions.slice(0, 3).join(', ')}.`
    }
    if (gapAnalysis.missingVarietals.length > 0) {
      query += ` I haven't tried ${gapAnalysis.missingVarietals.slice(0, 3).join(', ')}.`
    }
    if (context?.priceRange) {
      query += ` My budget is ${context.priceRange.min}-${context.priceRange.max} ${context.priceRange.currency}.`
    }

    return query
  }

  private buildContextualQuery(context: RecommendationContext): string {
    let query = "Recommend wines from my inventory"

    if (context.occasion) {
      query += ` for ${context.occasion}`
    }
    if (context.foodPairing) {
      query += ` to pair with ${context.foodPairing}`
    }
    if (context.companions && context.companions.length > 0) {
      query += ` for ${context.companions.length} people`
    }

    return query + "."
  }

  private async enhanceRecommendation(
    wine: Wine,
    urgencyScore: number,
    aiRec: any,
    tasteProfile: TasteProfile,
    context?: RecommendationContext
  ): Promise<EnhancedRecommendation> {
    const enhanced: EnhancedRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: tasteProfile.userId,
      type: 'inventory',
      wineId: wine.id,
      context: context || {},
      reasoning: aiRec?.reasoning || 'Recommended based on your preferences and drinking window.',
      confidence: aiRec?.confidence || 0.8,
      createdAt: new Date(),
      urgencyScore,
      personalizedReasoning: this.generatePersonalizedReasoning(wine, urgencyScore, tasteProfile),
      servingRecommendations: this.generateServingRecommendations(wine),
      pairingNotes: this.generatePairingNotes(wine, context),
      learningOpportunity: this.generateLearningOpportunity(wine, tasteProfile),
      drinkingWindowAlert: this.generateDrinkingWindowAlert(wine)
    }

    return enhanced
  }

  private generatePersonalizedReasoning(
    wine: Wine,
    urgencyScore: number,
    tasteProfile: TasteProfile
  ): string {
    let reasoning = `This ${wine.vintage} ${wine.name} from ${wine.producer}`

    if (urgencyScore > 0.8) {
      reasoning += " is at its peak drinking window and should be enjoyed soon"
    } else if (urgencyScore > 0.6) {
      reasoning += " is ready to drink and would be excellent tonight"
    } else {
      reasoning += " matches your taste preferences well"
    }

    // Add personalized elements based on taste profile
    const flavorProfile = wine.type === 'red' 
      ? tasteProfile.redWinePreferences
      : tasteProfile.whiteWinePreferences

    if (flavorProfile.preferredRegions.includes(wine.region)) {
      reasoning += ` and comes from ${wine.region}, one of your preferred regions`
    }

    return reasoning + "."
  }

  private generateServingRecommendations(wine: Wine): ServingRecommendations {
    const recommendations: ServingRecommendations = {}

    // Temperature recommendations based on wine type
    switch (wine.type) {
      case 'red':
        recommendations.temperature = { celsius: 16, fahrenheit: 61 }
        recommendations.decantingTime = wine.vintage < 2015 ? 60 : 30
        recommendations.glassType = 'Bordeaux glass'
        break
      case 'white':
        recommendations.temperature = { celsius: 10, fahrenheit: 50 }
        recommendations.glassType = 'White wine glass'
        break
      case 'sparkling':
        recommendations.temperature = { celsius: 6, fahrenheit: 43 }
        recommendations.glassType = 'Flute or tulip glass'
        break
    }

    recommendations.servingSize = '5 oz (150ml)'
    recommendations.optimalTiming = 'Serve immediately after opening'

    return recommendations
  }

  private generatePairingNotes(wine: Wine, context?: RecommendationContext): string | undefined {
    if (!context?.foodPairing) return undefined

    // Basic pairing logic - in production, this would be more sophisticated
    const food = context.foodPairing.toLowerCase()
    
    if (wine.type === 'red') {
      if (food.includes('beef') || food.includes('steak')) {
        return "Excellent pairing - the tannins will complement the rich meat flavors."
      }
      if (food.includes('cheese')) {
        return "Classic pairing - try with aged cheeses for best results."
      }
    } else if (wine.type === 'white') {
      if (food.includes('fish') || food.includes('seafood')) {
        return "Perfect match - the acidity will enhance the delicate flavors."
      }
      if (food.includes('chicken')) {
        return "Versatile pairing that works well with various preparations."
      }
    }

    return "This wine should complement your meal nicely."
  }

  private generateLearningOpportunity(_wine: Wine, _tasteProfile: TasteProfile): string | undefined {
    // For now, return undefined since we don't have experienceLevel in TasteProfile
    return undefined
  }

  private generateDrinkingWindowAlert(wine: Wine): DrinkingWindowAlert | undefined {
    const status = wine.drinkingWindow.currentStatus
    const now = new Date()
    const peakEnd = new Date(wine.drinkingWindow.peakEndDate)
    const latest = new Date(wine.drinkingWindow.latestDate)

    if (status === 'peak') {
      const daysToEnd = Math.ceil((peakEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysToEnd <= 90) {
        return {
          status: 'leaving_peak',
          message: `This wine is at its peak but will start declining soon.`,
          daysRemaining: daysToEnd
        }
      }
      return {
        status: 'at_peak',
        message: 'This wine is at its optimal drinking window.'
      }
    }

    if (status === 'declining') {
      const daysToEnd = Math.ceil((latest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysToEnd <= 180) {
        return {
          status: 'urgent',
          message: 'This wine should be consumed soon before it passes its prime.',
          daysRemaining: daysToEnd
        }
      }
    }

    return undefined
  }

  private analyzeTasteProfileGaps(
    _tasteProfile: TasteProfile,
    consumptionHistory: ConsumptionRecord[],
    inventory: Wine[]
  ): TasteProfileGapAnalysis {
    // Analyze what's missing from user's experience
    const allRegions = ['Bordeaux', 'Burgundy', 'Tuscany', 'Napa Valley', 'Barossa Valley', 'Rioja', 'Champagne']
    const allVarietals = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Chardonnay', 'Sauvignon Blanc', 'Riesling']
    const allTypes = ['red', 'white', 'sparkling', 'rosé', 'dessert']

    const experiencedRegions = new Set([
      ...inventory.map(w => w.region),
      ...consumptionHistory.map(c => inventory.find(w => w.id === c.wineId)?.region).filter(Boolean)
    ])

    const experiencedVarietals = new Set([
      ...inventory.flatMap(w => w.varietal),
      ...consumptionHistory.flatMap(c => inventory.find(w => w.id === c.wineId)?.varietal || [])
    ])

    const experiencedTypes = new Set([
      ...inventory.map(w => w.type),
      ...consumptionHistory.map(c => inventory.find(w => w.id === c.wineId)?.type).filter(Boolean)
    ])

    return {
      missingRegions: allRegions.filter(r => !experiencedRegions.has(r)),
      missingVarietals: allVarietals.filter(v => !experiencedVarietals.has(v)),
      underrepresentedTypes: allTypes.filter(t => !experiencedTypes.has(t as any)),
      priceRangeGaps: [],
      recommendedExpansions: []
    }
  }

  private filterWinesByContext(inventory: Wine[], context: RecommendationContext): Wine[] {
    let filtered = inventory.filter(wine => wine.quantity > 0)

    // Filter by price range if specified
    if (context.priceRange) {
      filtered = filtered.filter(wine => {
        if (!wine.purchasePrice) return true // Include wines without price data
        return wine.purchasePrice >= context.priceRange!.min && 
               wine.purchasePrice <= context.priceRange!.max
      })
    }

    // Filter by urgency
    if (context.urgency === 'high') {
      filtered = filtered.filter(wine => 
        wine.drinkingWindow.currentStatus === 'peak' || 
        wine.drinkingWindow.currentStatus === 'declining'
      )
    }

    // Basic food pairing filter
    if (context.foodPairing) {
      const food = context.foodPairing.toLowerCase()
      filtered = filtered.filter(wine => {
        if (food.includes('beef') || food.includes('steak') || food.includes('lamb')) {
          return wine.type === 'red'
        }
        if (food.includes('fish') || food.includes('seafood') || food.includes('oyster')) {
          return wine.type === 'white' || wine.type === 'sparkling'
        }
        if (food.includes('cheese')) {
          return true // Most wines pair with cheese
        }
        return true // Default: don't filter
      })
    }

    return filtered
  }

  private async enhancePurchaseRecommendation(
    rec: any,
    _gapAnalysis: TasteProfileGapAnalysis,
    tasteProfile: TasteProfile,
    context?: RecommendationContext
  ): Promise<EnhancedRecommendation> {
    const enhanced: EnhancedRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: tasteProfile.userId,
      type: 'purchase',
      suggestedWine: rec.suggestedWine,
      context: context || {},
      reasoning: rec.reasoning,
      confidence: rec.confidence,
      createdAt: new Date(),
      urgencyScore: 0.5, // Purchase recommendations have medium urgency
      personalizedReasoning: 'This wine would expand your collection based on your preferences.',
      learningOpportunity: 'This wine will help you explore new regions and styles.'
    }

    return enhanced
  }

  private async enhanceContextualRecommendation(
    wine: Wine,
    rec: any,
    context: RecommendationContext,
    tasteProfile: TasteProfile
  ): Promise<EnhancedRecommendation> {
    const enhanced: EnhancedRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: tasteProfile.userId,
      type: 'inventory',
      wineId: wine.id,
      context,
      reasoning: rec.reasoning,
      confidence: rec.confidence,
      createdAt: new Date(),
      urgencyScore: this.calculateUrgencyScore(wine),
      personalizedReasoning: `This ${wine.name} is perfect for ${context.occasion || 'your occasion'}`,
      servingRecommendations: this.generateServingRecommendations(wine),
      pairingNotes: this.generatePairingNotes(wine, context)
    }

    return enhanced
  }

  private buildTonightReasoning(
    winesWithUrgency: Array<{ wine: Wine; urgencyScore: number; personalizedScore: number }>,
    context?: RecommendationContext
  ): string {
    const topWine = winesWithUrgency[0]
    let reasoning = `Based on your inventory and preferences, I recommend the ${topWine.wine.name}`

    if (topWine.urgencyScore > 0.8) {
      reasoning += " as it's at its peak drinking window"
    } else if (topWine.personalizedScore > 0.7) {
      reasoning += " as it matches your taste preferences perfectly"
    }

    if (context?.occasion) {
      reasoning += ` for your ${context.occasion}`
    }

    return reasoning + "."
  }

  private buildPurchaseReasoning(
    gapAnalysis: TasteProfileGapAnalysis,
    context?: RecommendationContext
  ): string {
    let reasoning = "Based on your collection and taste profile, I recommend expanding into"

    if (gapAnalysis.missingRegions.length > 0) {
      reasoning += ` ${gapAnalysis.missingRegions.slice(0, 2).join(' and ')}`
    }

    if (gapAnalysis.missingVarietals.length > 0) {
      reasoning += ` and trying ${gapAnalysis.missingVarietals.slice(0, 2).join(' and ')}`
    }

    if (context?.priceRange) {
      reasoning += ` within your ${context.priceRange.min}-${context.priceRange.max} ${context.priceRange.currency} budget`
    }

    return reasoning + "."
  }

  private calculateOverallConfidence(recommendations: EnhancedRecommendation[]): number {
    if (recommendations.length === 0) return 0

    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length
    return Math.round(avgConfidence * 100) / 100
  }

  private generateTonightFollowUpQuestions(context?: RecommendationContext): string[] {
    const questions: string[] = []

    if (!context?.foodPairing) {
      questions.push("What will you be eating with this wine?")
    }

    if (!context?.occasion) {
      questions.push("What's the occasion for tonight's wine?")
    }

    questions.push("Would you like serving temperature and decanting recommendations?")

    return questions.slice(0, 2)
  }

  private generatePurchaseFollowUpQuestions(
    gapAnalysis: TasteProfileGapAnalysis,
    context?: RecommendationContext
  ): string[] {
    const questions: string[] = []

    if (!context?.priceRange) {
      questions.push("What's your budget for new wine purchases?")
    }

    if (gapAnalysis.missingRegions.length > 3) {
      questions.push("Are there specific wine regions you're most interested in exploring?")
    }

    questions.push("Would you like recommendations for wine shops or online retailers?")

    return questions.slice(0, 2)
  }

  private generateEmptyInventoryResponse(): PersonalizedRecommendationResponse {
    return {
      recommendations: [],
      reasoning: "Your wine inventory appears to be empty. Consider purchasing some wines to get personalized recommendations for tonight.",
      confidence: 0,
      followUpQuestions: [
        "Would you like recommendations for wines to purchase?",
        "What's your budget for building a wine collection?"
      ]
    }
  }
}

// ============================================================================
// Recommendation Feedback and Learning System
// ============================================================================

export class RecommendationFeedbackService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Record user feedback on a recommendation
   */
  async recordFeedback(
    recommendationId: string,
    userId: string,
    feedback: 'accepted' | 'rejected' | 'modified',
    reason?: string,
    modifiedContext?: RecommendationContext
  ): Promise<void> {
    try {
      // Update recommendation with feedback
      await this.supabase
        .from('recommendations')
        .update({
          user_feedback: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId)
        .eq('user_id', userId)

      // Log detailed feedback for learning
      await this.supabase
        .from('recommendation_feedback')
        .insert({
          recommendation_id: recommendationId,
          user_id: userId,
          feedback_type: feedback,
          reason,
          modified_context: modifiedContext,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error recording recommendation feedback:', error)
      throw error
    }
  }

  /**
   * Get recommendation history for a user
   */
  async getRecommendationHistory(
    userId: string,
    limit: number = 50,
    type?: 'inventory' | 'purchase' | 'pairing'
  ): Promise<Recommendation[]> {
    try {
      let query = this.supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('Error fetching recommendation history:', error)
      throw error
    }
  }

  /**
   * Get recommendation analytics for a user
   */
  async getRecommendationAnalytics(userId: string): Promise<RecommendationAnalytics> {
    try {
      const { data: recommendations, error } = await this.supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const total = recommendations.length
      const accepted = recommendations.filter((r: any) => r.user_feedback === 'accepted').length
      const rejected = recommendations.filter((r: any) => r.user_feedback === 'rejected').length
      const modified = recommendations.filter((r: any) => r.user_feedback === 'modified').length
      const pending = recommendations.filter((r: any) => !r.user_feedback).length

      const avgConfidence = total > 0 
        ? recommendations.reduce((sum: number, r: any) => sum + r.confidence, 0) / total 
        : 0

      const typeBreakdown = {
        inventory: recommendations.filter((r: any) => r.type === 'inventory').length,
        purchase: recommendations.filter((r: any) => r.type === 'purchase').length,
        pairing: recommendations.filter((r: any) => r.type === 'pairing').length
      }

      const totalWithFeedback = accepted + rejected + modified

      return {
        totalRecommendations: total,
        acceptanceRate: totalWithFeedback > 0 ? accepted / totalWithFeedback : 0,
        rejectionRate: totalWithFeedback > 0 ? rejected / totalWithFeedback : 0,
        modificationRate: totalWithFeedback > 0 ? modified / totalWithFeedback : 0,
        pendingFeedback: pending,
        averageConfidence: avgConfidence,
        typeBreakdown,
        lastRecommendation: recommendations[0]?.created_at
      }

    } catch (error) {
      console.error('Error fetching recommendation analytics:', error)
      throw error
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface RecommendationAnalytics {
  totalRecommendations: number
  acceptanceRate: number
  rejectionRate: number
  modificationRate: number
  pendingFeedback: number
  averageConfidence: number
  typeBreakdown: {
    inventory: number
    purchase: number
    pairing: number
  }
  lastRecommendation?: string
}

interface UserRecommendationData {
  userId: string
  inventory: Wine[]
  tasteProfile: TasteProfile
  consumptionHistory: ConsumptionRecord[]
  context?: RecommendationContext
}

interface TasteProfileGapAnalysis {
  missingRegions: string[]
  missingVarietals: string[]
  underrepresentedTypes: string[]
  priceRangeGaps: { min: number; max: number }[]
  recommendedExpansions: string[]
}