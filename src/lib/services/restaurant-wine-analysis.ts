import { 
  ExtractedWineListItem, 
  TasteProfile, 
  RecommendationContext,
  Wine,
  WineSuggestion
} from '@/types'
import { createClient } from '@supabase/supabase-js'

/**
 * Restaurant Wine Analysis Service
 * Handles wine identification, cross-referencing, and personalized recommendations
 * for restaurant wine lists
 */

export interface RestaurantWineMatch {
  extractedWine: ExtractedWineListItem
  matchedWine?: Wine
  confidence: number
  matchType: 'exact' | 'partial' | 'similar' | 'none'
  matchedFields: string[]
}

export interface RestaurantRecommendation {
  wine: RestaurantWineMatch
  score: number
  reasoning: string[]
  foodPairingScore?: number
  priceScore?: number
  tasteProfileScore?: number
  urgencyScore?: number
  explanation: string
}

export interface RestaurantAnalysisResult {
  totalWines: number
  processedWines: RestaurantWineMatch[]
  recommendations: RestaurantRecommendation[]
  context: RecommendationContext
  analysisMetadata: {
    processingTime: number
    matchingAccuracy: number
    recommendationConfidence: number
  }
}

export interface MealContext {
  dishName?: string
  cuisine?: string
  mainIngredient?: string
  cookingMethod?: string
  spiceLevel?: 'mild' | 'medium' | 'spicy'
  richness?: 'light' | 'medium' | 'rich'
  occasion?: string
}

export class RestaurantWineAnalysisService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  /**
   * Analyze restaurant wine list and provide personalized recommendations
   */
  async analyzeRestaurantWineList(
    extractedWines: ExtractedWineListItem[],
    userId: string,
    context: RecommendationContext & { meal?: MealContext } = {}
  ): Promise<RestaurantAnalysisResult> {
    const startTime = Date.now()

    try {
      // Get user's taste profile
      const tasteProfile = await this.getUserTasteProfile(userId)
      
      // Get user's wine inventory for comparison
      const userInventory = await this.getUserInventory(userId)

      // Cross-reference extracted wines with database
      const wineMatches = await this.crossReferenceWines(extractedWines, userInventory)

      // Generate personalized recommendations
      const recommendations = await this.generateRecommendations(
        wineMatches,
        tasteProfile,
        context
      )

      const processingTime = Date.now() - startTime
      const matchingAccuracy = this.calculateMatchingAccuracy(wineMatches)
      const recommendationConfidence = this.calculateRecommendationConfidence(recommendations)

      return {
        totalWines: extractedWines.length,
        processedWines: wineMatches,
        recommendations: recommendations.slice(0, 10), // Top 10 recommendations
        context,
        analysisMetadata: {
          processingTime,
          matchingAccuracy,
          recommendationConfidence
        }
      }
    } catch (error) {
      console.error('Restaurant wine analysis failed:', error)
      throw new Error('Failed to analyze restaurant wine list')
    }
  }

  /**
   * Cross-reference extracted wines with wine database and user inventory
   */
  private async crossReferenceWines(
    extractedWines: ExtractedWineListItem[],
    userInventory: Wine[]
  ): Promise<RestaurantWineMatch[]> {
    const matches: RestaurantWineMatch[] = []

    for (const extractedWine of extractedWines) {
      const match = await this.findWineMatch(extractedWine, userInventory)
      matches.push(match)
    }

    return matches
  }

  /**
   * Find the best match for an extracted wine
   */
  private async findWineMatch(
    extractedWine: ExtractedWineListItem,
    userInventory: Wine[]
  ): Promise<RestaurantWineMatch> {
    // First, try to match against user's inventory
    const inventoryMatch = this.matchAgainstInventory(extractedWine, userInventory)
    if (inventoryMatch.confidence > 0.8) {
      return inventoryMatch
    }

    // Then try to match against wine database
    const databaseMatch = await this.matchAgainstDatabase(extractedWine)
    if (databaseMatch.confidence > inventoryMatch.confidence) {
      return databaseMatch
    }

    return inventoryMatch
  }

  /**
   * Match extracted wine against user's inventory
   */
  private matchAgainstInventory(
    extractedWine: ExtractedWineListItem,
    userInventory: Wine[]
  ): RestaurantWineMatch {
    let bestMatch: RestaurantWineMatch = {
      extractedWine,
      confidence: 0,
      matchType: 'none',
      matchedFields: []
    }

    for (const wine of userInventory) {
      const match = this.calculateWineMatchScore(extractedWine, wine)
      if (match.confidence > bestMatch.confidence) {
        bestMatch = {
          extractedWine,
          matchedWine: wine,
          confidence: match.confidence,
          matchType: match.matchType,
          matchedFields: match.matchedFields
        }
      }
    }

    return bestMatch
  }

  /**
   * Match extracted wine against wine database
   */
  private async matchAgainstDatabase(
    extractedWine: ExtractedWineListItem
  ): Promise<RestaurantWineMatch> {
    try {
      // Search for similar wines in the database
      const { data: wines, error } = await this.supabase
        .from('wines')
        .select('*')
        .or(`name.ilike.%${extractedWine.name}%,producer.ilike.%${extractedWine.producer || ''}%`)
        .limit(10)

      if (error || !wines || wines.length === 0) {
        return {
          extractedWine,
          confidence: 0,
          matchType: 'none',
          matchedFields: []
        }
      }

      // Find the best match
      let bestMatch: RestaurantWineMatch = {
        extractedWine,
        confidence: 0,
        matchType: 'none',
        matchedFields: []
      }

      for (const wine of wines) {
        const match = this.calculateWineMatchScore(extractedWine, wine)
        if (match.confidence > bestMatch.confidence) {
          bestMatch = {
            extractedWine,
            matchedWine: wine,
            confidence: match.confidence,
            matchType: match.matchType,
            matchedFields: match.matchedFields
          }
        }
      }

      return bestMatch
    } catch (error) {
      console.error('Database wine matching failed:', error)
      return {
        extractedWine,
        confidence: 0,
        matchType: 'none',
        matchedFields: []
      }
    }
  }

  /**
   * Calculate match score between extracted wine and database wine
   */
  private calculateWineMatchScore(
    extractedWine: ExtractedWineListItem,
    wine: Wine
  ): { confidence: number; matchType: 'exact' | 'partial' | 'similar' | 'none'; matchedFields: string[] } {
    const matchedFields: string[] = []
    let score = 0
    let maxScore = 0

    // Name matching (highest weight)
    maxScore += 40
    const nameMatch = this.calculateStringMatch(extractedWine.name, wine.name)
    score += nameMatch * 40
    if (nameMatch > 0.7) matchedFields.push('name')

    // Producer matching
    if (extractedWine.producer && wine.producer) {
      maxScore += 30
      const producerMatch = this.calculateStringMatch(extractedWine.producer, wine.producer)
      score += producerMatch * 30
      if (producerMatch > 0.7) matchedFields.push('producer')
    }

    // Vintage matching
    if (extractedWine.vintage && wine.vintage) {
      maxScore += 20
      if (extractedWine.vintage === wine.vintage) {
        score += 20
        matchedFields.push('vintage')
      }
    }

    // Region matching (if we can extract it)
    if (wine.region) {
      maxScore += 10
      const regionMatch = this.extractRegionFromDescription(extractedWine.description || '')
      if (regionMatch && this.calculateStringMatch(regionMatch, wine.region) > 0.7) {
        score += 10
        matchedFields.push('region')
      }
    }

    const confidence = maxScore > 0 ? score / maxScore : 0

    let matchType: 'exact' | 'partial' | 'similar' | 'none'
    if (confidence > 0.9) matchType = 'exact'
    else if (confidence > 0.7) matchType = 'partial'
    else if (confidence > 0.4) matchType = 'similar'
    else matchType = 'none'

    return { confidence, matchType, matchedFields }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return 1

    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1

    const distance = this.levenshteinDistance(s1, s2)
    return 1 - distance / maxLength
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Extract region information from wine description
   */
  private extractRegionFromDescription(description: string): string | null {
    const regionPatterns = [
      /\b(Bordeaux|Burgundy|Champagne|Chianti|Rioja|Napa|Sonoma|Barolo|Brunello)\b/i,
      /\b(Tuscany|Loire|Rhône|Alsace|Mosel|Piedmont|Mendoza|Marlborough)\b/i,
      /\b(Chablis|Sancerre|Pouilly|Muscadet|Côtes du Rhône|Châteauneuf)\b/i
    ]

    for (const pattern of regionPatterns) {
      const match = description.match(pattern)
      if (match) return match[0]
    }

    return null
  }

  /**
   * Generate personalized recommendations based on wine matches and user preferences
   */
  private async generateRecommendations(
    wineMatches: RestaurantWineMatch[],
    tasteProfile: TasteProfile | null,
    context: RecommendationContext & { meal?: MealContext }
  ): Promise<RestaurantRecommendation[]> {
    const recommendations: RestaurantRecommendation[] = []

    for (const match of wineMatches) {
      const recommendation = await this.scoreWineRecommendation(match, tasteProfile, context)
      if (recommendation.score > 0.3) { // Only include wines with reasonable scores
        recommendations.push(recommendation)
      }
    }

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score)
  }

  /**
   * Score a wine recommendation based on multiple factors
   */
  private async scoreWineRecommendation(
    match: RestaurantWineMatch,
    tasteProfile: TasteProfile | null,
    context: RecommendationContext & { meal?: MealContext }
  ): Promise<RestaurantRecommendation> {
    const reasoning: string[] = []
    let totalScore = 0
    let maxScore = 0

    // Base confidence from wine matching
    const baseScore = match.confidence * 0.2
    totalScore += baseScore
    maxScore += 0.2

    if (match.confidence > 0.7) {
      reasoning.push(`High confidence match (${Math.round(match.confidence * 100)}%)`)
    }

    // Taste profile scoring
    let tasteProfileScore = 0
    if (tasteProfile && match.matchedWine) {
      tasteProfileScore = this.calculateTasteProfileMatch(match.matchedWine, tasteProfile)
      totalScore += tasteProfileScore * 0.4
      maxScore += 0.4

      if (tasteProfileScore > 0.7) {
        reasoning.push('Excellent match for your taste preferences')
      } else if (tasteProfileScore > 0.5) {
        reasoning.push('Good match for your taste preferences')
      }
    }

    // Food pairing scoring
    let foodPairingScore = 0
    if (context.meal && match.matchedWine) {
      foodPairingScore = this.calculateFoodPairingScore(match.matchedWine, context.meal)
      totalScore += foodPairingScore * 0.25
      maxScore += 0.25

      if (foodPairingScore > 0.7) {
        reasoning.push(`Excellent pairing with ${context.meal.dishName || 'your meal'}`)
      } else if (foodPairingScore > 0.5) {
        reasoning.push(`Good pairing with ${context.meal.dishName || 'your meal'}`)
      }
    }

    // Price scoring (if price range is specified)
    let priceScore = 0
    if (context.priceRange && match.extractedWine.price) {
      priceScore = this.calculatePriceScore(match.extractedWine.price, context.priceRange)
      totalScore += priceScore * 0.15
      maxScore += 0.15

      if (priceScore > 0.8) {
        reasoning.push('Within your preferred price range')
      }
    }

    // Normalize score
    const finalScore = maxScore > 0 ? totalScore / maxScore : 0

    // Generate explanation
    const explanation = this.generateWineExplanation(match, tasteProfile, context, reasoning)

    return {
      wine: match,
      score: finalScore,
      reasoning,
      foodPairingScore,
      priceScore,
      tasteProfileScore,
      explanation
    }
  }

  /**
   * Calculate how well a wine matches the user's taste profile
   */
  private calculateTasteProfileMatch(wine: Wine, tasteProfile: TasteProfile): number {
    // Get the appropriate flavor profile based on wine type
    let flavorProfile
    switch (wine.type) {
      case 'red':
        flavorProfile = tasteProfile.redWinePreferences
        break
      case 'white':
        flavorProfile = tasteProfile.whiteWinePreferences
        break
      case 'sparkling':
        flavorProfile = tasteProfile.sparklingPreferences
        break
      default:
        flavorProfile = tasteProfile.redWinePreferences // Default fallback
    }

    let score = 0
    let factors = 0

    // Check preferred regions
    if (flavorProfile.preferredRegions.includes(wine.region)) {
      score += 0.3
      factors++
    }

    // Check preferred varietals
    const hasPreferredVarietal = wine.varietal.some(v => 
      flavorProfile.preferredVarietals.includes(v)
    )
    if (hasPreferredVarietal) {
      score += 0.3
      factors++
    }

    // Check disliked characteristics
    const hasDislikedCharacteristics = wine.varietal.some(v => 
      flavorProfile.dislikedCharacteristics.includes(v)
    )
    if (hasDislikedCharacteristics) {
      score -= 0.2
    }

    // General preferences
    if (tasteProfile.generalPreferences.preferredRegions?.includes(wine.region)) {
      score += 0.2
      factors++
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate food pairing score
   */
  private calculateFoodPairingScore(wine: Wine, meal: MealContext): number {
    let score = 0.5 // Base score

    // Wine type and main ingredient pairing
    if (meal.mainIngredient) {
      const pairingRules = this.getFoodPairingRules()
      const wineTypeRules = pairingRules[wine.type] || {}
      const ingredientScore = wineTypeRules[meal.mainIngredient.toLowerCase()] || 0
      score += ingredientScore * 0.3
    }

    // Cooking method considerations
    if (meal.cookingMethod) {
      const cookingMethodScore = this.getCookingMethodScore(wine.type, meal.cookingMethod)
      score += cookingMethodScore * 0.2
    }

    // Spice level considerations
    if (meal.spiceLevel) {
      const spiceScore = this.getSpiceLevelScore(wine.type, meal.spiceLevel)
      score += spiceScore * 0.2
    }

    // Richness matching
    if (meal.richness) {
      const richnessScore = this.getRichnessScore(wine, meal.richness)
      score += richnessScore * 0.2
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Get food pairing rules
   */
  private getFoodPairingRules(): Record<string, Record<string, number>> {
    return {
      red: {
        beef: 0.8,
        lamb: 0.9,
        pork: 0.6,
        chicken: 0.4,
        fish: 0.2,
        seafood: 0.1,
        cheese: 0.7,
        pasta: 0.6,
        vegetables: 0.3
      },
      white: {
        fish: 0.9,
        seafood: 0.8,
        chicken: 0.7,
        pork: 0.5,
        cheese: 0.6,
        pasta: 0.5,
        vegetables: 0.7,
        beef: 0.2,
        lamb: 0.1
      },
      sparkling: {
        seafood: 0.8,
        cheese: 0.7,
        chicken: 0.6,
        fish: 0.7,
        vegetables: 0.5,
        beef: 0.3,
        lamb: 0.3,
        pork: 0.4,
        pasta: 0.4
      }
    }
  }

  /**
   * Calculate cooking method score
   */
  private getCookingMethodScore(wineType: string, cookingMethod: string): number {
    const scores: Record<string, Record<string, number>> = {
      red: {
        grilled: 0.3,
        roasted: 0.3,
        braised: 0.4,
        fried: 0.2,
        steamed: 0.1,
        raw: 0.0
      },
      white: {
        steamed: 0.4,
        poached: 0.4,
        grilled: 0.2,
        fried: 0.3,
        roasted: 0.2,
        raw: 0.3
      },
      sparkling: {
        fried: 0.4,
        raw: 0.4,
        steamed: 0.3,
        grilled: 0.2,
        roasted: 0.2,
        braised: 0.1
      }
    }

    return scores[wineType]?.[cookingMethod.toLowerCase()] || 0
  }

  /**
   * Calculate spice level score
   */
  private getSpiceLevelScore(wineType: string, spiceLevel: string): number {
    const scores: Record<string, Record<string, number>> = {
      red: {
        mild: 0.2,
        medium: 0.3,
        spicy: 0.1
      },
      white: {
        mild: 0.3,
        medium: 0.2,
        spicy: 0.3
      },
      sparkling: {
        mild: 0.2,
        medium: 0.3,
        spicy: 0.4
      }
    }

    return scores[wineType]?.[spiceLevel] || 0
  }

  /**
   * Calculate richness score
   */
  private getRichnessScore(wine: Wine, richness: string): number {
    // This would ideally use wine characteristics from the database
    // For now, we'll use basic wine type assumptions
    const wineRichness = this.estimateWineRichness(wine)
    
    const richnessMap = { light: 1, medium: 2, rich: 3 }
    const wineRichnessValue = richnessMap[wineRichness] || 2
    const mealRichnessValue = richnessMap[richness as keyof typeof richnessMap] || 2

    // Perfect match gets full score, adjacent levels get partial score
    const difference = Math.abs(wineRichnessValue - mealRichnessValue)
    return Math.max(0, 1 - difference * 0.3)
  }

  /**
   * Estimate wine richness based on type and characteristics
   */
  private estimateWineRichness(wine: Wine): 'light' | 'medium' | 'rich' {
    // This is a simplified estimation - in a real system, you'd have
    // detailed wine characteristics in the database
    switch (wine.type) {
      case 'red':
        if (wine.varietal.some(v => ['Pinot Noir', 'Gamay'].includes(v))) return 'light'
        if (wine.varietal.some(v => ['Cabernet Sauvignon', 'Syrah', 'Malbec'].includes(v))) return 'rich'
        return 'medium'
      case 'white':
        if (wine.varietal.some(v => ['Sauvignon Blanc', 'Pinot Grigio'].includes(v))) return 'light'
        if (wine.varietal.some(v => ['Chardonnay', 'Viognier'].includes(v))) return 'medium'
        return 'light'
      case 'sparkling':
        return 'light'
      default:
        return 'medium'
    }
  }

  /**
   * Calculate price score based on user's price range
   */
  private calculatePriceScore(winePrice: string, priceRange: { min: number; max: number }): number {
    // Extract numeric price from string
    const priceMatch = winePrice.match(/[\d.,]+/)
    if (!priceMatch) return 0.5 // Neutral score if price can't be parsed

    const price = parseFloat(priceMatch[0].replace(',', ''))
    
    if (price >= priceRange.min && price <= priceRange.max) {
      return 1.0 // Perfect score for wines in range
    }

    // Partial score for wines slightly outside range
    const rangeMidpoint = (priceRange.min + priceRange.max) / 2
    const rangeWidth = priceRange.max - priceRange.min
    const distance = Math.abs(price - rangeMidpoint)
    
    return Math.max(0, 1 - distance / rangeWidth)
  }

  /**
   * Generate detailed explanation for wine recommendation
   */
  private generateWineExplanation(
    match: RestaurantWineMatch,
    tasteProfile: TasteProfile | null,
    context: RecommendationContext & { meal?: MealContext },
    reasoning: string[]
  ): string {
    const wine = match.extractedWine
    const explanationParts: string[] = []

    // Wine identification
    if (match.matchedWine) {
      explanationParts.push(
        `This ${wine.producer ? `${wine.producer} ` : ''}${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''} is a ${match.matchedWine.type} wine from ${match.matchedWine.region}.`
      )
    } else {
      explanationParts.push(
        `This ${wine.name}${wine.vintage ? ` ${wine.vintage}` : ''} appears to be a quality selection.`
      )
    }

    // Taste profile explanation
    if (tasteProfile && match.matchedWine) {
      const flavorProfile = match.matchedWine.type === 'red' 
        ? tasteProfile.redWinePreferences 
        : tasteProfile.whiteWinePreferences

      if (flavorProfile.preferredRegions.includes(match.matchedWine.region)) {
        explanationParts.push(`You've shown a preference for wines from ${match.matchedWine.region}.`)
      }

      const preferredVarietals = match.matchedWine.varietal.filter(v => 
        flavorProfile.preferredVarietals.includes(v)
      )
      if (preferredVarietals.length > 0) {
        explanationParts.push(`The ${preferredVarietals.join(' and ')} matches your taste preferences.`)
      }
    }

    // Food pairing explanation
    if (context.meal && match.matchedWine) {
      if (context.meal.dishName) {
        explanationParts.push(
          `This ${match.matchedWine.type} wine should pair well with ${context.meal.dishName}.`
        )
      }

      if (context.meal.mainIngredient) {
        const pairingAdvice = this.getFoodPairingAdvice(match.matchedWine.type, context.meal.mainIngredient)
        if (pairingAdvice) {
          explanationParts.push(pairingAdvice)
        }
      }
    }

    // Price consideration
    if (wine.price && context.priceRange) {
      const priceMatch = wine.price.match(/[\d.,]+/)
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace(',', ''))
        if (price >= context.priceRange.min && price <= context.priceRange.max) {
          explanationParts.push(`At ${wine.price}, it fits within your preferred price range.`)
        }
      }
    }

    return explanationParts.join(' ')
  }

  /**
   * Get food pairing advice
   */
  private getFoodPairingAdvice(wineType: string, mainIngredient: string): string | null {
    const advice: Record<string, Record<string, string>> = {
      red: {
        beef: "Red wines complement the rich flavors and proteins in beef dishes.",
        lamb: "The tannins in red wine pair beautifully with lamb's robust flavor.",
        pork: "A medium-bodied red can enhance the savory qualities of pork.",
        cheese: "Red wines and aged cheeses create a classic pairing."
      },
      white: {
        fish: "White wines won't overpower the delicate flavors of fish.",
        seafood: "The acidity in white wine complements seafood perfectly.",
        chicken: "White wine enhances chicken without overwhelming its subtle taste.",
        vegetables: "White wines pair well with lighter vegetable dishes."
      },
      sparkling: {
        seafood: "The bubbles and acidity cleanse the palate between bites of seafood.",
        cheese: "Sparkling wine cuts through rich, creamy cheeses beautifully.",
        fried: "The effervescence helps cut through fried foods' richness."
      }
    }

    return advice[wineType]?.[mainIngredient.toLowerCase()] || null
  }

  /**
   * Get user's taste profile
   */
  private async getUserTasteProfile(userId: string): Promise<TasteProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('taste_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) return null
      return data as TasteProfile
    } catch (error) {
      console.error('Failed to fetch taste profile:', error)
      return null
    }
  }

  /**
   * Get user's wine inventory
   */
  private async getUserInventory(userId: string): Promise<Wine[]> {
    try {
      const { data, error } = await this.supabase
        .from('wines')
        .select('*')
        .eq('user_id', userId)

      if (error || !data) return []
      return data as Wine[]
    } catch (error) {
      console.error('Failed to fetch user inventory:', error)
      return []
    }
  }

  /**
   * Calculate matching accuracy across all wine matches
   */
  private calculateMatchingAccuracy(matches: RestaurantWineMatch[]): number {
    if (matches.length === 0) return 0

    const totalConfidence = matches.reduce((sum, match) => sum + match.confidence, 0)
    return totalConfidence / matches.length
  }

  /**
   * Calculate overall recommendation confidence
   */
  private calculateRecommendationConfidence(recommendations: RestaurantRecommendation[]): number {
    if (recommendations.length === 0) return 0

    const totalScore = recommendations.reduce((sum, rec) => sum + rec.score, 0)
    return totalScore / recommendations.length
  }
}

// Export singleton instance
export const restaurantWineAnalysisService = new RestaurantWineAnalysisService()