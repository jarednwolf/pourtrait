// Food Pairing and Contextual Advice Service
// Implements intelligent food pairing recommendations with educational explanations

import { Wine, TasteProfile, RecommendationContext, Recommendation } from '@/types'
import { AIRecommendationEngine } from '@/lib/ai/recommendation-engine'
import { AIRecommendationRequest } from '@/lib/ai/types'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Food Pairing Types
// ============================================================================

export interface FoodPairingRequest {
  userId: string
  foodDescription: string
  cuisine?: string
  cookingMethod?: string
  spiceLevel?: 'none' | 'mild' | 'medium' | 'hot'
  richness?: 'light' | 'medium' | 'rich'
  context?: RecommendationContext
  inventory?: Wine[]
  tasteProfile?: TasteProfile
}

export interface FoodPairingResponse {
  pairings: FoodPairingRecommendation[]
  reasoning: string
  confidence: number
  educationalNotes: string
  alternativePairings?: FoodPairingRecommendation[]
  servingTips?: ServingTips
}

export interface FoodPairingRecommendation extends Recommendation {
  pairingScore: number
  pairingType: 'classic' | 'regional' | 'complementary' | 'contrasting' | 'adventurous'
  pairingExplanation: string
  educationalContext?: string
  servingRecommendations?: ServingRecommendations
  alternativeOptions?: string[]
}

export interface ServingTips {
  wineTemperature?: string
  servingOrder?: string
  glassware?: string
  timing?: string
  preparation?: string[]
}

export interface ServingRecommendations {
  temperature: {
    celsius: number
    fahrenheit: number
  }
  decantingTime?: number
  glassType: string
  servingSize: string
  optimalTiming: string
}

export interface ContextualFilter {
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  wineType?: ('red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified')[]
  availability: 'inventory_only' | 'purchase_allowed' | 'any'
  urgency?: 'low' | 'medium' | 'high'
  occasion?: string
  companions?: number
}

// ============================================================================
// Food Pairing Knowledge Base
// ============================================================================

interface PairingRule {
  foodCategory: string
  wineTypes: string[]
  reasoning: string
  confidence: number
  examples: string[]
}

const CLASSIC_PAIRING_RULES: PairingRule[] = [
  {
    foodCategory: 'red_meat',
    wineTypes: ['red'],
    reasoning: 'Tannins in red wine complement the proteins and fats in red meat',
    confidence: 0.9,
    examples: ['Cabernet Sauvignon with steak', 'Malbec with lamb', 'Syrah with beef stew']
  },
  {
    foodCategory: 'white_fish',
    wineTypes: ['white', 'sparkling'],
    reasoning: 'Light wines preserve the delicate flavors of white fish',
    confidence: 0.85,
    examples: ['Sauvignon Blanc with sole', 'Champagne with oysters', 'Pinot Grigio with halibut']
  },
  {
    foodCategory: 'salmon',
    wineTypes: ['white', 'red', 'rosé'],
    reasoning: 'Salmon\'s richness can handle both light reds and full-bodied whites',
    confidence: 0.8,
    examples: ['Pinot Noir with grilled salmon', 'Chardonnay with cedar plank salmon', 'Rosé with salmon tartare']
  },
  {
    foodCategory: 'poultry',
    wineTypes: ['white', 'red'],
    reasoning: 'Versatile protein that pairs with both light reds and medium-bodied whites',
    confidence: 0.8,
    examples: ['Chardonnay with roasted chicken', 'Pinot Noir with duck', 'Riesling with turkey']
  },
  {
    foodCategory: 'pork',
    wineTypes: ['white', 'red', 'rosé'],
    reasoning: 'Pork\'s mild flavor works with a wide range of wine styles',
    confidence: 0.75,
    examples: ['Riesling with pork tenderloin', 'Côtes du Rhône with pork chops', 'Rosé with pork belly']
  },
  {
    foodCategory: 'cheese',
    wineTypes: ['red', 'white', 'sparkling'],
    reasoning: 'Cheese pairings depend on texture and intensity of the cheese',
    confidence: 0.8,
    examples: ['Cabernet with aged cheddar', 'Sancerre with goat cheese', 'Port with blue cheese']
  },
  {
    foodCategory: 'spicy_food',
    wineTypes: ['white', 'rosé', 'sparkling'],
    reasoning: 'Off-dry wines and bubbles help cool spicy heat',
    confidence: 0.85,
    examples: ['Riesling with Thai curry', 'Gewürztraminer with Indian food', 'Prosecco with spicy appetizers']
  },
  {
    foodCategory: 'dessert',
    wineTypes: ['dessert', 'sparkling'],
    reasoning: 'Sweet wines should be as sweet or sweeter than the dessert',
    confidence: 0.9,
    examples: ['Port with chocolate', 'Moscato with fruit tarts', 'Ice wine with crème brûlée']
  }
]

const REGIONAL_PAIRING_RULES: Record<string, PairingRule[]> = {
  italian: [
    {
      foodCategory: 'pasta_tomato',
      wineTypes: ['red'],
      reasoning: 'Italian reds complement tomato-based sauces perfectly',
      confidence: 0.9,
      examples: ['Chianti with marinara', 'Sangiovese with arrabbiata', 'Barbera with puttanesca']
    },
    {
      foodCategory: 'pasta_cream',
      wineTypes: ['white'],
      reasoning: 'Crisp whites cut through rich cream sauces',
      confidence: 0.85,
      examples: ['Pinot Grigio with alfredo', 'Soave with carbonara', 'Vermentino with cacio e pepe']
    }
  ],
  french: [
    {
      foodCategory: 'coq_au_vin',
      wineTypes: ['red'],
      reasoning: 'Classic French pairing - cook with the wine you drink',
      confidence: 0.95,
      examples: ['Burgundy with coq au vin', 'Côtes du Rhône with beef bourguignon']
    }
  ],
  asian: [
    {
      foodCategory: 'sushi',
      wineTypes: ['white', 'sparkling'],
      reasoning: 'Clean, crisp wines complement delicate fish flavors',
      confidence: 0.8,
      examples: ['Sake (rice wine)', 'Chablis with sashimi', 'Champagne with uni']
    }
  ]
}

// ============================================================================
// Food Pairing Service
// ============================================================================

export class FoodPairingService {
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
   * Generate food pairing recommendations
   */
  async generateFoodPairings(request: FoodPairingRequest): Promise<FoodPairingResponse> {
    try {
      // Get user data if not provided
      const userData = await this.getUserData(request.userId, request)

      // Analyze food characteristics
      const foodAnalysis = this.analyzeFoodCharacteristics(request)

      // Apply contextual filters
      const filteredWines = this.applyContextualFilters(
        userData.inventory,
        this.buildContextualFilter(request.context)
      )

      // Generate classic pairing recommendations
      const classicPairings = this.generateClassicPairings(
        foodAnalysis,
        filteredWines,
        userData.tasteProfile
      )

      // Generate AI-enhanced recommendations
      const aiPairings = await this.generateAIPairings(
        request,
        foodAnalysis,
        filteredWines,
        userData.tasteProfile
      )

      // Combine and rank recommendations
      const allPairings = [...classicPairings, ...aiPairings]
      const rankedPairings = this.rankPairings(allPairings, userData.tasteProfile, foodAnalysis)

      // Generate educational content
      const educationalNotes = this.generateEducationalNotes(
        foodAnalysis,
        rankedPairings,
        userData.tasteProfile
      )

      // Generate serving tips
      const servingTips = this.generateServingTips(rankedPairings[0], foodAnalysis)

      return {
        pairings: rankedPairings.slice(0, 3), // Top 3 recommendations
        reasoning: rankedPairings.length > 0 
          ? this.buildPairingReasoning(foodAnalysis, rankedPairings[0])
          : 'No suitable pairings found in your inventory.',
        confidence: this.calculateOverallConfidence(rankedPairings),
        educationalNotes,
        alternativePairings: rankedPairings.slice(3, 6),
        servingTips
      }

    } catch (error) {
      console.error('Error generating food pairings:', error)
      throw error
    }
  }

  /**
   * Generate contextual wine recommendations with multi-parameter filtering
   */
  async generateContextualRecommendations(
    userId: string,
    filters: ContextualFilter,
    tasteProfile?: TasteProfile
  ): Promise<FoodPairingResponse> {
    try {
      const userData = await this.getUserData(userId, { userId, foodDescription: '' })
      const profile = tasteProfile || userData.tasteProfile

      // Apply all contextual filters
      const filteredWines = this.applyContextualFilters(userData.inventory, filters)

      if (filteredWines.length === 0) {
        return this.generateEmptyInventoryResponse(filters)
      }

      // Generate contextual recommendations
      const contextualPairings = this.generateContextualPairings(
        filteredWines,
        filters,
        profile
      )

      // Enhance with AI if food context is provided
      let aiEnhancedPairings = contextualPairings
      if (filters.occasion && filters.occasion.includes('dinner')) {
        const aiRequest: AIRecommendationRequest = {
          userId,
          query: this.buildContextualQuery(filters),
          context: this.filtersToContext(filters),
          userProfile: profile,
          inventory: filteredWines,
          experienceLevel: 'intermediate'
        }

        const aiResponse = await this.aiEngine.generateRecommendations(aiRequest)
        if (aiResponse && aiResponse.recommendations) {
          aiEnhancedPairings = this.enhanceWithAIRecommendations(
            contextualPairings,
            aiResponse.recommendations
          )
        }
      }

      return {
        pairings: aiEnhancedPairings.slice(0, 3),
        reasoning: aiEnhancedPairings.length > 0 
          ? this.buildContextualReasoning(filters, aiEnhancedPairings[0])
          : 'No wines match your current criteria.',
        confidence: this.calculateOverallConfidence(aiEnhancedPairings),
        educationalNotes: this.generateContextualEducation(filters, aiEnhancedPairings),
        servingTips: aiEnhancedPairings.length > 0 
          ? this.generateContextualServingTips(filters, aiEnhancedPairings[0])
          : undefined
      }

    } catch (error) {
      console.error('Error generating contextual recommendations:', error)
      throw error
    }
  }

  // ============================================================================
  // Food Analysis Methods
  // ============================================================================

  private analyzeFoodCharacteristics(request: FoodPairingRequest): FoodAnalysis {
    const food = request.foodDescription.toLowerCase()
    
    // Determine food category
    const category = this.determineFoodCategory(food)
    
    // Analyze cooking method impact
    const cookingImpact = this.analyzeCookingMethod(request.cookingMethod, food)
    
    // Determine flavor intensity
    const intensity = this.determineFlavorIntensity(food, request.spiceLevel, request.richness)
    
    // Identify key flavor components
    const flavorComponents = this.identifyFlavorComponents(food, request.cuisine)

    return {
      category,
      intensity,
      cookingImpact,
      flavorComponents,
      cuisine: request.cuisine,
      spiceLevel: request.spiceLevel || 'none',
      richness: request.richness || 'medium'
    }
  }

  private determineFoodCategory(food: string): string {
    const categories = {
      red_meat: ['beef', 'steak', 'lamb', 'venison', 'bison'],
      white_fish: ['sole', 'halibut', 'cod', 'sea bass', 'flounder'],
      salmon: ['salmon', 'trout', 'arctic char'],
      poultry: ['chicken', 'turkey', 'duck', 'goose', 'quail'],
      pork: ['pork', 'ham', 'bacon', 'prosciutto'],
      cheese: ['cheese', 'brie', 'cheddar', 'goat cheese', 'blue cheese'],
      pasta: ['pasta', 'spaghetti', 'linguine', 'penne', 'ravioli'],
      spicy_food: ['curry', 'chili', 'jalapeño', 'sriracha', 'wasabi'],
      dessert: ['chocolate', 'cake', 'tart', 'ice cream', 'crème brûlée']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => food.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  private analyzeCookingMethod(method: string | undefined, food: string): CookingImpact {
    if (!method) {
      // Infer from food description
      if (food.includes('grilled') || food.includes('bbq')) method = 'grilled'
      else if (food.includes('roasted') || food.includes('baked')) method = 'roasted'
      else if (food.includes('fried')) method = 'fried'
      else if (food.includes('steamed')) method = 'steamed'
      else method = 'unknown'
    }

    const impacts = {
      grilled: { intensity: 'high', flavors: ['smoky', 'charred'], wineStyle: 'bold' },
      roasted: { intensity: 'medium-high', flavors: ['caramelized', 'concentrated'], wineStyle: 'medium-full' },
      fried: { intensity: 'high', flavors: ['rich', 'fatty'], wineStyle: 'crisp-acidic' },
      steamed: { intensity: 'low', flavors: ['clean', 'delicate'], wineStyle: 'light-fresh' },
      braised: { intensity: 'medium', flavors: ['tender', 'sauce-integrated'], wineStyle: 'medium' },
      raw: { intensity: 'low', flavors: ['pure', 'delicate'], wineStyle: 'crisp-mineral' }
    }

    return impacts[method as keyof typeof impacts] || { 
      intensity: 'medium', 
      flavors: ['balanced'], 
      wineStyle: 'versatile' 
    }
  }

  private determineFlavorIntensity(
    food: string, 
    spiceLevel?: string, 
    richness?: string
  ): 'light' | 'medium' | 'intense' {
    let intensity = 1 // Base intensity

    // Spice level impact
    const spiceImpact = { none: 0, mild: 1, medium: 2, hot: 3 }
    intensity += spiceImpact[spiceLevel as keyof typeof spiceImpact] || 0

    // Richness impact
    const richnessImpact = { light: 0, medium: 1, rich: 2 }
    intensity += richnessImpact[richness as keyof typeof richnessImpact] || 1

    // Food-specific adjustments
    if (food.includes('truffle') || food.includes('foie gras')) intensity += 2
    if (food.includes('delicate') || food.includes('light')) intensity -= 1

    if (intensity <= 2) return 'light'
    if (intensity <= 4) return 'medium'
    return 'intense'
  }

  private identifyFlavorComponents(food: string, cuisine?: string): string[] {
    const components: string[] = []

    // Base flavor identification
    const flavorMap = {
      tomato: ['acidic', 'umami'],
      cream: ['rich', 'fatty'],
      lemon: ['acidic', 'citrus'],
      garlic: ['pungent', 'savory'],
      herbs: ['aromatic', 'fresh'],
      mushroom: ['earthy', 'umami'],
      cheese: ['salty', 'umami', 'fatty']
    }

    for (const [ingredient, flavors] of Object.entries(flavorMap)) {
      if (food.includes(ingredient)) {
        components.push(...flavors)
      }
    }

    // Cuisine-specific components
    if (cuisine) {
      const cuisineComponents = {
        italian: ['herbs', 'tomato', 'olive oil'],
        french: ['butter', 'cream', 'wine'],
        asian: ['soy', 'ginger', 'sesame'],
        indian: ['spices', 'heat', 'complex'],
        mexican: ['chili', 'lime', 'cilantro']
      }

      const cuisineFlavorMap = cuisineComponents[cuisine as keyof typeof cuisineComponents]
      if (cuisineFlavorMap) {
        components.push(...cuisineFlavorMap)
      }
    }

    return [...new Set(components)] // Remove duplicates
  }

  // ============================================================================
  // Pairing Generation Methods
  // ============================================================================

  private generateClassicPairings(
    foodAnalysis: FoodAnalysis,
    wines: Wine[],
    tasteProfile: TasteProfile
  ): FoodPairingRecommendation[] {
    const pairings: FoodPairingRecommendation[] = []

    // Find applicable pairing rules
    const applicableRules = CLASSIC_PAIRING_RULES.filter(rule => 
      rule.foodCategory === foodAnalysis.category
    )

    // Add regional rules if cuisine is specified
    if (foodAnalysis.cuisine && REGIONAL_PAIRING_RULES[foodAnalysis.cuisine]) {
      applicableRules.push(...REGIONAL_PAIRING_RULES[foodAnalysis.cuisine])
    }

    for (const rule of applicableRules) {
      const matchingWines = wines.filter(wine => 
        rule.wineTypes.includes(wine.type)
      )

      for (const wine of matchingWines.slice(0, 2)) { // Limit per rule
        const pairingScore = this.calculatePairingScore(wine, foodAnalysis, rule, tasteProfile)
        
        pairings.push({
          id: `pairing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: tasteProfile.userId,
          type: 'pairing' as const,
          wineId: wine.id,
          context: { foodPairing: foodAnalysis.category },
          reasoning: rule.reasoning,
          confidence: rule.confidence,
          createdAt: new Date(),
          pairingScore,
          pairingType: 'classic' as const,
          pairingExplanation: this.generatePairingExplanation(wine, foodAnalysis, rule),
          educationalContext: this.generateEducationalContext(wine, foodAnalysis, rule),
          servingRecommendations: this.generateServingRecommendations(wine, foodAnalysis)
        })
      }
    }

    return pairings
  }

  private async generateAIPairings(
    request: FoodPairingRequest,
    foodAnalysis: FoodAnalysis,
    wines: Wine[],
    tasteProfile: TasteProfile
  ): Promise<FoodPairingRecommendation[]> {
    if (wines.length === 0) return []

    const aiRequest: AIRecommendationRequest = {
      userId: request.userId,
      query: this.buildFoodPairingQuery(request, foodAnalysis),
      context: { 
        foodPairing: request.foodDescription,
        occasion: request.context?.occasion,
        ...request.context 
      },
      userProfile: tasteProfile,
      inventory: wines,
      experienceLevel: 'intermediate'
    }

    try {
      const aiResponse = await this.aiEngine.generateRecommendations(aiRequest)
      
      if (!aiResponse || !aiResponse.recommendations) {
        return []
      }
      
      return aiResponse.recommendations.map(rec => ({
        id: `ai_pairing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: tasteProfile.userId,
        type: 'pairing' as const,
        wineId: rec.wineId,
        suggestedWine: rec.suggestedWine,
        context: { foodPairing: request.foodDescription },
        reasoning: rec.reasoning,
        confidence: rec.confidence,
        createdAt: new Date(),
        pairingScore: rec.confidence,
        pairingType: 'adventurous' as const,
        pairingExplanation: rec.reasoning,
        educationalContext: rec.educationalContext
      }))
    } catch (error) {
      console.error('Error generating AI pairings:', error)
      return []
    }
  }

  private generateContextualPairings(
    wines: Wine[],
    filters: ContextualFilter,
    tasteProfile: TasteProfile
  ): FoodPairingRecommendation[] {
    return wines.map(wine => {
      const contextualScore = this.calculateContextualScore(wine, filters, tasteProfile)
      
      return {
        id: `contextual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: tasteProfile.userId,
        type: 'inventory' as const,
        wineId: wine.id,
        context: this.filtersToContext(filters),
        reasoning: this.generateContextualReasoning(wine, filters),
        confidence: contextualScore,
        createdAt: new Date(),
        pairingScore: contextualScore,
        pairingType: 'complementary' as const,
        pairingExplanation: this.generateContextualExplanation(wine, filters)
      }
    }).sort((a, b) => b.pairingScore - a.pairingScore)
  }

  // ============================================================================
  // Filtering and Scoring Methods
  // ============================================================================

  private applyContextualFilters(wines: Wine[], filters: ContextualFilter): Wine[] {
    let filtered = wines.filter(wine => wine.quantity > 0)

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(wine => {
        if (!wine.purchasePrice) return true
        return wine.purchasePrice >= filters.priceRange!.min && 
               wine.purchasePrice <= filters.priceRange!.max
      })
    }

    // Wine type filter
    if (filters.wineType && filters.wineType.length > 0) {
      filtered = filtered.filter(wine => filters.wineType!.includes(wine.type))
    }

    // Urgency filter (drinking window priority)
    if (filters.urgency === 'high') {
      filtered = filtered.filter(wine => 
        wine.drinkingWindow.currentStatus === 'peak' || 
        wine.drinkingWindow.currentStatus === 'declining'
      )
    } else if (filters.urgency === 'low') {
      filtered = filtered.filter(wine => 
        wine.drinkingWindow.currentStatus === 'ready' ||
        wine.drinkingWindow.currentStatus === 'too_young'
      )
    }

    // Availability filter
    if (filters.availability === 'inventory_only') {
      // Already filtered to inventory wines
    }

    return filtered
  }

  private calculatePairingScore(
    wine: Wine,
    foodAnalysis: FoodAnalysis,
    rule: PairingRule,
    tasteProfile: TasteProfile
  ): number {
    let score = rule.confidence // Base score from rule

    // Adjust for personal preferences
    const flavorProfile = this.getRelevantFlavorProfile(wine.type, tasteProfile)
    
    // Region preference bonus
    if (flavorProfile.preferredRegions.includes(wine.region)) {
      score += 0.1
    }

    // Varietal preference bonus
    const hasPreferredVarietal = wine.varietal.some(v => 
      flavorProfile.preferredVarietals.includes(v)
    )
    if (hasPreferredVarietal) {
      score += 0.1
    }

    // Drinking window urgency
    const urgencyBonus = this.calculateUrgencyBonus(wine)
    score += urgencyBonus * 0.05

    // Food intensity matching
    const intensityMatch = this.calculateIntensityMatch(wine, foodAnalysis)
    score += intensityMatch * 0.1

    return Math.min(score, 1.0)
  }

  private calculateContextualScore(
    wine: Wine,
    filters: ContextualFilter,
    tasteProfile: TasteProfile
  ): number {
    let score = 0.5 // Base score

    // Personal preference alignment
    const flavorProfile = this.getRelevantFlavorProfile(wine.type, tasteProfile)
    
    if (flavorProfile.preferredRegions.includes(wine.region)) {
      score += 0.2
    }

    const hasPreferredVarietal = wine.varietal.some(v => 
      flavorProfile.preferredVarietals.includes(v)
    )
    if (hasPreferredVarietal) {
      score += 0.2
    }

    // Drinking window consideration
    const urgencyBonus = this.calculateUrgencyBonus(wine)
    score += urgencyBonus * 0.1

    // Occasion appropriateness
    if (filters.occasion) {
      const occasionScore = this.calculateOccasionScore(wine, filters.occasion)
      score += occasionScore * 0.1
    }

    // Price appropriateness (prefer mid-range of budget)
    if (filters.priceRange && wine.purchasePrice) {
      const priceRange = filters.priceRange.max - filters.priceRange.min
      const midPoint = filters.priceRange.min + (priceRange / 2)
      const priceDistance = Math.abs(wine.purchasePrice - midPoint) / priceRange
      score += (1 - priceDistance) * 0.1
    }

    return Math.min(score, 1.0)
  }

  private calculateUrgencyBonus(wine: Wine): number {
    const status = wine.drinkingWindow.currentStatus
    const urgencyScores = {
      'too_young': 0.1,
      'ready': 0.6,
      'peak': 0.9,
      'declining': 0.8,
      'over_hill': 0.3
    }
    return urgencyScores[status] || 0.5
  }

  private calculateIntensityMatch(wine: Wine, foodAnalysis: FoodAnalysis): number {
    // Simple intensity matching logic
    const wineIntensity = this.estimateWineIntensity(wine)
    const foodIntensity = foodAnalysis.intensity

    const intensityMap = { light: 1, medium: 2, intense: 3 }
    const wineLvl = intensityMap[wineIntensity]
    const foodLvl = intensityMap[foodIntensity]

    // Perfect match gets 1.0, adjacent levels get 0.7, distant levels get 0.3
    const difference = Math.abs(wineLvl - foodLvl)
    if (difference === 0) return 1.0
    if (difference === 1) return 0.7
    return 0.3
  }

  private estimateWineIntensity(wine: Wine): 'light' | 'medium' | 'intense' {
    // Simple heuristic based on wine type and region
    if (wine.type === 'red') {
      const boldRegions = ['Napa Valley', 'Barossa Valley', 'Mendoza', 'Tuscany']
      if (boldRegions.some(region => wine.region.includes(region))) return 'intense'
      
      const boldVarietals = ['Cabernet Sauvignon', 'Syrah', 'Malbec', 'Nebbiolo']
      if (wine.varietal.some(v => boldVarietals.includes(v))) return 'intense'
      
      return 'medium'
    } else if (wine.type === 'white') {
      const boldVarietals = ['Chardonnay', 'Viognier', 'Gewürztraminer']
      if (wine.varietal.some(v => boldVarietals.includes(v))) return 'medium'
      
      return 'light'
    }
    
    return 'medium' // Default for sparkling, rosé, etc.
  }

  private calculateOccasionScore(wine: Wine, occasion: string): number {
    const occasionMap = {
      'romantic dinner': wine.type === 'red' ? 0.8 : 0.6,
      'celebration': wine.type === 'sparkling' ? 1.0 : 0.5,
      'casual dinner': 0.8,
      'business dinner': wine.type === 'red' ? 0.9 : 0.7,
      'holiday': wine.type === 'red' || wine.type === 'sparkling' ? 0.9 : 0.6
    }

    return occasionMap[occasion.toLowerCase() as keyof typeof occasionMap] || 0.5
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getUserData(
    userId: string,
    request: Partial<FoodPairingRequest>
  ): Promise<UserRecommendationData> {
    const inventory = request.inventory || await this.getUserInventory(userId)
    const tasteProfile = request.tasteProfile || await this.getUserTasteProfile(userId)

    return {
      userId,
      inventory,
      tasteProfile,
      consumptionHistory: [], // Not needed for food pairing
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

  private getRelevantFlavorProfile(wineType: string, tasteProfile: TasteProfile) {
    switch (wineType) {
      case 'red':
        return tasteProfile.redWinePreferences
      case 'white':
        return tasteProfile.whiteWinePreferences
      case 'sparkling':
        return tasteProfile.sparklingPreferences
      default:
        return tasteProfile.redWinePreferences // Default fallback
    }
  }

  private buildContextualFilter(context?: RecommendationContext): ContextualFilter {
    return {
      priceRange: context?.priceRange,
      availability: 'inventory_only',
      urgency: context?.urgency,
      occasion: context?.occasion,
      companions: context?.companions?.length
    }
  }

  private buildFoodPairingQuery(
    request: FoodPairingRequest,
    _foodAnalysis: FoodAnalysis
  ): string {
    let query = `What wine from my inventory pairs best with ${request.foodDescription}?`

    if (request.cuisine) {
      query += ` This is ${request.cuisine} cuisine.`
    }

    if (request.cookingMethod) {
      query += ` The food is ${request.cookingMethod}.`
    }

    if (request.spiceLevel && request.spiceLevel !== 'none') {
      query += ` The spice level is ${request.spiceLevel}.`
    }

    return query
  }

  private buildContextualQuery(filters: ContextualFilter): string {
    let query = "Recommend wines from my inventory"

    if (filters.occasion) {
      query += ` for ${filters.occasion}`
    }

    if (filters.companions && filters.companions > 1) {
      query += ` for ${filters.companions} people`
    }

    if (filters.priceRange) {
      query += ` within ${filters.priceRange.min}-${filters.priceRange.max} ${filters.priceRange.currency}`
    }

    return query + "."
  }

  private filtersToContext(filters: ContextualFilter): RecommendationContext {
    return {
      occasion: filters.occasion,
      priceRange: filters.priceRange,
      urgency: filters.urgency,
      companions: filters.companions ? Array(filters.companions).fill('guest') : undefined
    }
  }

  private rankPairings(
    pairings: FoodPairingRecommendation[],
    _tasteProfile: TasteProfile,
    _foodAnalysis: FoodAnalysis
  ): FoodPairingRecommendation[] {
    return pairings.sort((a, b) => {
      // Primary sort by pairing score
      if (b.pairingScore !== a.pairingScore) {
        return b.pairingScore - a.pairingScore
      }
      
      // Secondary sort by confidence
      return b.confidence - a.confidence
    })
  }

  private generatePairingExplanation(
    wine: Wine,
    foodAnalysis: FoodAnalysis,
    rule: PairingRule
  ): string {
    return `This ${wine.vintage} ${wine.name} from ${wine.region} ${rule.reasoning.toLowerCase()}. The ${wine.varietal.join(' and ')} grape${wine.varietal.length > 1 ? 's' : ''} provide${wine.varietal.length === 1 ? 's' : ''} the perfect complement to your ${foodAnalysis.category.replace('_', ' ')}.`
  }

  private generateEducationalContext(
    _wine: Wine,
    _foodAnalysis: FoodAnalysis,
    rule: PairingRule
  ): string {
    return `This pairing follows the classic principle that ${rule.reasoning.toLowerCase()}. ${rule.examples[0]} is a traditional example of this pairing style.`
  }

  private generateServingRecommendations(
    wine: Wine,
    foodAnalysis: FoodAnalysis
  ): ServingRecommendations {
    const baseTemp = wine.type === 'red' ? 16 : wine.type === 'white' ? 10 : 6
    const glassTypes = {
      red: 'Bordeaux glass',
      white: 'White wine glass',
      sparkling: 'Flute or tulip glass',
      rosé: 'White wine glass',
      dessert: 'Dessert wine glass',
      fortified: 'Port glass'
    }

    return {
      temperature: {
        celsius: baseTemp,
        fahrenheit: Math.round(baseTemp * 9/5 + 32)
      },
      decantingTime: wine.type === 'red' && wine.vintage < 2015 ? 60 : undefined,
      glassType: glassTypes[wine.type] || 'Universal wine glass',
      servingSize: '5 oz (150ml)',
      optimalTiming: foodAnalysis.cookingImpact.intensity === 'high' ? 
        'Serve 15 minutes before the meal' : 'Serve with the meal'
    }
  }

  private generateEducationalNotes(
    foodAnalysis: FoodAnalysis,
    pairings: FoodPairingRecommendation[],
    _tasteProfile: TasteProfile
  ): string {
    if (pairings.length === 0) return "No suitable pairings found in your inventory."

    const topPairing = pairings[0]
    let notes = `Food and wine pairing works on the principle of complementing or contrasting flavors. `

    if (foodAnalysis.intensity === 'intense') {
      notes += `Since your dish has intense flavors, we've selected wines that can stand up to them without being overwhelmed. `
    } else if (foodAnalysis.intensity === 'light') {
      notes += `Your delicate dish pairs best with lighter wines that won't overpower the subtle flavors. `
    }

    if (topPairing.pairingType === 'classic') {
      notes += `This is a classic pairing that has been enjoyed for generations.`
    } else if (topPairing.pairingType === 'adventurous') {
      notes += `This is a more adventurous pairing that creates interesting flavor contrasts.`
    }

    return notes
  }

  private generateServingTips(
    pairing: FoodPairingRecommendation | undefined,
    foodAnalysis: FoodAnalysis
  ): ServingTips {
    const tips: ServingTips = {}

    if (pairing?.servingRecommendations) {
      tips.wineTemperature = `Serve at ${pairing.servingRecommendations.temperature.celsius}°C (${pairing.servingRecommendations.temperature.fahrenheit}°F)`
      tips.glassware = `Use a ${pairing.servingRecommendations.glassType.toLowerCase()}`
    }

    if (foodAnalysis.cookingImpact.intensity === 'high') {
      tips.timing = "Open the wine 30 minutes before serving to let it breathe"
    }

    tips.preparation = [
      "Taste the wine first to understand its characteristics",
      "Take small sips between bites to cleanse your palate",
      "Notice how the wine changes the perception of the food flavors"
    ]

    return tips
  }

  private generateContextualReasoning(wine: Wine, filters: ContextualFilter): string {
    let reasoning = `This ${wine.name} from ${wine.producer}`

    if (filters.occasion) {
      reasoning += ` is well-suited for ${filters.occasion}`
    }

    if (filters.urgency === 'high' && wine.drinkingWindow.currentStatus === 'peak') {
      reasoning += ` and is at its optimal drinking window`
    }

    if (filters.priceRange && wine.purchasePrice) {
      reasoning += ` and fits within your budget`
    }

    return reasoning + "."
  }

  private generateContextualExplanation(_wine: Wine, filters: ContextualFilter): string {
    return `Selected based on your specified criteria: ${Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
      .join(', ')}.`
  }

  private buildPairingReasoning(
    foodAnalysis: FoodAnalysis,
    topPairing: FoodPairingRecommendation
  ): string {
    return `For your ${foodAnalysis.category.replace('_', ' ')}, I recommend ${topPairing.pairingExplanation} This pairing works because ${topPairing.reasoning.toLowerCase()}.`
  }

  private buildContextualReasoning(
    filters: ContextualFilter,
    _topPairing: FoodPairingRecommendation
  ): string {
    return `Based on your criteria (${Object.keys(filters).join(', ')}), this wine offers the best combination of personal preference alignment and contextual appropriateness.`
  }

  private calculateOverallConfidence(pairings: FoodPairingRecommendation[]): number {
    if (pairings.length === 0) return 0
    
    const avgConfidence = pairings.reduce((sum, p) => sum + p.confidence, 0) / pairings.length
    return Math.round(avgConfidence * 100) / 100
  }

  private generateContextualEducation(
    filters: ContextualFilter,
    pairings: FoodPairingRecommendation[]
  ): string {
    if (pairings.length === 0) return "No wines match your current criteria."

    let education = "When selecting wines for specific contexts, consider: "
    
    if (filters.occasion) {
      education += `the formality and mood of ${filters.occasion}, `
    }
    
    if (filters.priceRange) {
      education += "your budget constraints, "
    }
    
    if (filters.urgency === 'high') {
      education += "wines that need to be consumed soon, "
    }

    education += "and your personal taste preferences."

    return education
  }

  private generateContextualServingTips(
    filters: ContextualFilter,
    _pairing: FoodPairingRecommendation
  ): ServingTips {
    const tips: ServingTips = {}

    if (filters.companions && filters.companions > 4) {
      tips.preparation = ["Consider opening multiple bottles for larger groups"]
    }

    if (filters.occasion?.includes('celebration')) {
      tips.timing = "Chill sparkling wines extra cold for celebrations"
    }

    return tips
  }

  private enhanceWithAIRecommendations(
    contextualPairings: FoodPairingRecommendation[],
    aiRecommendations: any[]
  ): FoodPairingRecommendation[] {
    // Merge AI insights with contextual pairings
    return contextualPairings.map(pairing => {
      const aiMatch = aiRecommendations.find(ai => ai.wineId === pairing.wineId)
      if (aiMatch) {
        pairing.reasoning = aiMatch.reasoning
        pairing.confidence = Math.max(pairing.confidence, aiMatch.confidence)
        pairing.educationalContext = aiMatch.educationalContext
      }
      return pairing
    })
  }

  private generateEmptyInventoryResponse(_filters: ContextualFilter): FoodPairingResponse {
    return {
      pairings: [],
      reasoning: "No wines in your inventory match the specified criteria.",
      confidence: 0,
      educationalNotes: "Consider adjusting your filters or adding wines to your inventory that match your preferences."
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface FoodAnalysis {
  category: string
  intensity: 'light' | 'medium' | 'intense'
  cookingImpact: CookingImpact
  flavorComponents: string[]
  cuisine?: string
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot'
  richness: 'light' | 'medium' | 'rich'
}

interface CookingImpact {
  intensity: string
  flavors: string[]
  wineStyle: string
}

interface UserRecommendationData {
  userId: string
  inventory: Wine[]
  tasteProfile: TasteProfile
  consumptionHistory: any[]
  context?: RecommendationContext
}