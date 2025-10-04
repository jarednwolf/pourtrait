// Context Analysis Service for AI Recommendations

import { 
  ContextAnalysis, 
  OccasionContext, 
  FoodPairingContext, 
  PreferenceContext, 
  ConstraintContext, 
  UrgencyContext,
  AIRecommendationRequest 
} from './types'
import { Wine, TasteProfile, RecommendationContext } from '@/types'

// ============================================================================
// Context Analysis Service
// ============================================================================

export class ContextAnalyzer {
  /**
   * Analyzes the full context for AI recommendations
   */
  static analyzeContext(request: AIRecommendationRequest): ContextAnalysis {
    return {
      occasion: this.analyzeOccasion(request.context, request.query),
      foodPairing: this.analyzeFoodPairing(request.context, request.query),
      preferences: this.analyzePreferences(request.userProfile, request.inventory),
      constraints: this.analyzeConstraints(request.context, request.inventory),
      urgency: this.analyzeUrgency(request.context, request.inventory, request.query)
    }
  }

  /**
   * Analyzes occasion context from user input
   */
  private static analyzeOccasion(context: RecommendationContext, query: string): OccasionContext {
    const lowerQuery = query.toLowerCase()
    const lowerOccasion = context.occasion?.toLowerCase() || ''

    // Determine occasion type
    let occasionType = 'general'
    let formality: 'casual' | 'semi_formal' | 'formal' = 'casual'

    if (lowerQuery.includes('dinner party') || lowerOccasion.includes('dinner party')) {
      occasionType = 'dinner_party'
      formality = 'semi_formal'
    } else if (lowerQuery.includes('romantic') || lowerOccasion.includes('romantic')) {
      occasionType = 'romantic_dinner'
      formality = 'semi_formal'
    } else if (lowerQuery.includes('celebration') || lowerOccasion.includes('celebration')) {
      occasionType = 'celebration'
      formality = 'formal'
    } else if (lowerQuery.includes('casual') || lowerOccasion.includes('casual')) {
      occasionType = 'casual_evening'
      formality = 'casual'
    } else if (lowerQuery.includes('business') || lowerOccasion.includes('business')) {
      occasionType = 'business_dinner'
      formality = 'formal'
    }

    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night' = 'evening'
    if (lowerQuery.includes('lunch') || lowerQuery.includes('afternoon')) {
      timeOfDay = 'afternoon'
    } else if (lowerQuery.includes('brunch') || lowerQuery.includes('morning')) {
      timeOfDay = 'morning'
    } else if (lowerQuery.includes('late night') || lowerQuery.includes('nightcap')) {
      timeOfDay = 'late_night'
    }

    // Determine season
    let season: 'spring' | 'summer' | 'fall' | 'winter' = this.getCurrentSeason()
    if (context.season) {
      season = context.season
    }

    // Determine companion count
    const companionCount = context.companions?.length || 1

    return {
      type: occasionType,
      formality,
      timeOfDay,
      season,
      companionCount,
      specialConsiderations: this.extractSpecialConsiderations(query)
    }
  }

  /**
   * Analyzes food pairing context
   */
  private static analyzeFoodPairing(context: RecommendationContext, query: string): FoodPairingContext {
    const lowerQuery = query.toLowerCase()
    const foodPairing = context.foodPairing?.toLowerCase() || ''

    // Extract main dish
    const mainDish = this.extractMainDish(foodPairing + ' ' + lowerQuery)

    // Determine cuisine type
    const cuisine = this.extractCuisine(foodPairing + ' ' + lowerQuery)

    // Extract flavors
    const flavors = this.extractFlavors(foodPairing + ' ' + lowerQuery)

    // Determine cooking method
    const cookingMethod = this.extractCookingMethod(foodPairing + ' ' + lowerQuery)

    // Determine richness level
    const richness = this.determineRichness(mainDish, cookingMethod, flavors)

    // Determine spice level
    const spiceLevel = this.determineSpiceLevel(flavors, cuisine)

    return {
      mainDish,
      cuisine,
      flavors,
      cookingMethod,
      richness,
      spiceLevel
    }
  }

  /**
   * Analyzes user preferences context
   */
  private static analyzePreferences(profile: TasteProfile, inventory?: Wine[]): PreferenceContext {
    // Get recent consumption patterns
    const recentConsumption = inventory?.slice(-10) || []

    // Extract disliked characteristics with null checks
    const dislikedWines = [
      ...(profile.redWinePreferences?.dislikedCharacteristics || []),
      ...(profile.whiteWinePreferences?.dislikedCharacteristics || []),
      ...(profile.sparklingPreferences?.dislikedCharacteristics || [])
    ]

    // Extract preferred producers from learning history
    const preferredProducers = (profile.learningHistory || [])
      .filter(record => record.rating >= 4)
      .map(record => record.wineId)
      .slice(0, 5)

    // Calculate adventurousness based on variety in consumption
    const adventurousness = this.calculateAdventurousness(profile, recentConsumption)

    return {
      tasteProfile: profile,
      recentConsumption,
      dislikedWines,
      preferredProducers,
      adventurousness
    }
  }

  /**
   * Analyzes constraint context
   */
  private static analyzeConstraints(context: RecommendationContext, inventory?: Wine[]): ConstraintContext {
    // Determine availability
    let availability: 'inventory_only' | 'purchase_allowed' | 'restaurant_list' = 'purchase_allowed'
    if (inventory && inventory.length > 0) {
      availability = 'inventory_only'
    }

    return {
      priceRange: context.priceRange,
      availability,
      timeConstraints: this.extractTimeConstraints(),
      dietaryRestrictions: this.extractDietaryRestrictions()
    }
  }

  /**
   * Analyzes urgency context
   */
  private static analyzeUrgency(
    _context: RecommendationContext, 
    inventory?: Wine[], 
    query?: string
  ): UrgencyContext {
    const lowerQuery = query?.toLowerCase() || ''
    
    // Determine urgency level
    let level: 'low' | 'medium' | 'high' = 'medium'
    if (lowerQuery.includes('tonight') || lowerQuery.includes('now') || lowerQuery.includes('immediately')) {
      level = 'high'
    } else if (lowerQuery.includes('planning') || lowerQuery.includes('future') || lowerQuery.includes('next week')) {
      level = 'low'
    }

    // Check for drinking window priority
    const drinkingWindowPriority = inventory?.some(wine => 
      wine.drinkingWindow.currentStatus === 'declining' || 
      wine.drinkingWindow.currentStatus === 'over_hill'
    ) || false

    return {
      level,
      drinkingWindowPriority,
      immediateNeed: level === 'high',
      planningAhead: level === 'low'
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) {return 'spring'}
    if (month >= 5 && month <= 7) {return 'summer'}
    if (month >= 8 && month <= 10) {return 'fall'}
    return 'winter'
  }

  private static extractSpecialConsiderations(query: string): string[] {
    const considerations: string[] = []
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('anniversary')) {considerations.push('anniversary')}
    if (lowerQuery.includes('birthday')) {considerations.push('birthday')}
    if (lowerQuery.includes('first time')) {considerations.push('first_time_guest')}
    if (lowerQuery.includes('impress')) {considerations.push('impressive_selection')}
    if (lowerQuery.includes('budget')) {considerations.push('budget_conscious')}
    if (lowerQuery.includes('special')) {considerations.push('special_occasion')}

    return considerations
  }

  private static extractMainDish(text: string): string | undefined {
    const dishes = [
      'steak', 'beef', 'lamb', 'pork', 'chicken', 'duck', 'turkey',
      'salmon', 'tuna', 'cod', 'lobster', 'crab', 'shrimp',
      'pasta', 'risotto', 'pizza', 'salad', 'soup',
      'cheese', 'chocolate', 'dessert'
    ]

    for (const dish of dishes) {
      if (text.includes(dish)) {
        return dish
      }
    }

    return undefined
  }

  private static extractCuisine(text: string): string | undefined {
    const cuisines = [
      'italian', 'french', 'spanish', 'german', 'american',
      'asian', 'chinese', 'japanese', 'thai', 'indian',
      'mexican', 'mediterranean', 'greek'
    ]

    for (const cuisine of cuisines) {
      if (text.includes(cuisine)) {
        return cuisine
      }
    }

    return undefined
  }

  private static extractFlavors(text: string): string[] {
    const flavorKeywords = [
      'spicy', 'sweet', 'sour', 'bitter', 'salty', 'umami',
      'rich', 'light', 'heavy', 'creamy', 'tangy', 'smoky',
      'grilled', 'roasted', 'fried', 'steamed', 'raw'
    ]

    return flavorKeywords.filter(flavor => text.includes(flavor))
  }

  private static extractCookingMethod(text: string): string | undefined {
    const methods = [
      'grilled', 'roasted', 'braised', 'fried', 'steamed',
      'baked', 'sautéed', 'poached', 'smoked', 'raw'
    ]

    for (const method of methods) {
      if (text.includes(method)) {
        return method
      }
    }

    return undefined
  }

  private static determineRichness(
    mainDish?: string, 
    cookingMethod?: string, 
    flavors?: string[]
  ): 'light' | 'medium' | 'rich' {
    const richIndicators = ['beef', 'lamb', 'duck', 'cream', 'butter', 'cheese', 'braised', 'rich', 'steak']
    const lightIndicators = ['fish', 'chicken', 'salad', 'steamed', 'poached', 'light']

    const text = [mainDish, cookingMethod, ...(flavors || [])].join(' ').toLowerCase()

    if (richIndicators.some(indicator => text.includes(indicator))) {
      return 'rich'
    } else if (lightIndicators.some(indicator => text.includes(indicator))) {
      return 'light'
    }

    return 'medium'
  }

  private static determineSpiceLevel(flavors?: string[], cuisine?: string): 'none' | 'mild' | 'medium' | 'hot' {
    const spiceIndicators = {
      hot: ['spicy', 'hot', 'chili', 'pepper', 'thai', 'indian', 'mexican'],
      medium: ['garlic', 'onion', 'herbs', 'seasoned'],
      mild: ['herb', 'lemon', 'wine sauce']
    }

    const text = [...(flavors || []), cuisine || ''].join(' ').toLowerCase()

    if (spiceIndicators.hot.some(indicator => text.includes(indicator))) {
      return 'hot'
    } else if (spiceIndicators.medium.some(indicator => text.includes(indicator))) {
      return 'medium'
    } else if (spiceIndicators.mild.some(indicator => text.includes(indicator))) {
      return 'mild'
    }

    return 'none'
  }

  private static calculateAdventurousness(profile: TasteProfile, recentConsumption: Wine[]): number {
    // Calculate based on variety in recent consumption and learning history
    const uniqueRegions = new Set(recentConsumption.map(wine => wine.region)).size
    const uniqueVarietals = new Set(recentConsumption.flatMap(wine => wine.varietal)).size
    const learningHistoryLength = (profile.learningHistory || []).length

    // Scale from 1-10 based on variety and willingness to try new things
    const varietyScore = Math.min(10, (uniqueRegions + uniqueVarietals) / 2)
    const experienceScore = Math.min(10, learningHistoryLength / 5)

    return Math.max(1, Math.round((varietyScore + experienceScore) / 2))
  }

  private static extractTimeConstraints(): string | undefined {
    // This could be enhanced to parse time-related constraints from context
    return undefined
  }

  private static extractDietaryRestrictions(): string[] | undefined {
    // This could be enhanced to parse dietary restrictions from context
    return undefined
  }
}