import { Wine, Recommendation, RecommendationContext } from '@/types'
import { DrinkingWindowService } from './drinking-window'

/**
 * Service for integrating drinking window logic into wine recommendations
 */
export class DrinkingWindowRecommendationService {
  /**
   * Filter and prioritize wines based on drinking window urgency
   */
  static prioritizeByDrinkingWindow(
    wines: Wine[],
    context?: RecommendationContext
  ): Wine[] {
    // Calculate urgency scores for all wines
    const winesWithUrgency = wines.map(wine => ({
      wine,
      urgencyScore: DrinkingWindowService.getDrinkingUrgencyScore(wine),
      status: wine.drinkingWindow.currentStatus
    }))
    
    // Apply context-based filtering
    let filteredWines = winesWithUrgency
    
    if (context?.urgency) {
      filteredWines = this.filterByContextUrgency(winesWithUrgency, context.urgency)
    }
    
    // Sort by drinking window priority
    return filteredWines
      .sort((a, b) => {
        // First priority: wines in peak or ready status
        const statusPriority = this.getStatusPriority(a.status) - this.getStatusPriority(b.status)
        if (statusPriority !== 0) return statusPriority
        
        // Second priority: urgency score
        return b.urgencyScore - a.urgencyScore
      })
      .map(item => item.wine)
  }
  
  /**
   * Get wines suitable for immediate consumption
   */
  static getWinesForTonight(wines: Wine[]): Wine[] {
    return wines
      .filter(wine => {
        const status = wine.drinkingWindow.currentStatus
        return status === 'ready' || status === 'peak' || status === 'declining'
      })
      .sort((a, b) => {
        // Prioritize wines that need to be consumed soon
        const urgencyA = DrinkingWindowService.getDrinkingUrgencyScore(a)
        const urgencyB = DrinkingWindowService.getDrinkingUrgencyScore(b)
        return urgencyB - urgencyA
      })
  }
  
  /**
   * Get wines suitable for special occasions (can wait)
   */
  static getWinesForSpecialOccasions(wines: Wine[]): Wine[] {
    return wines
      .filter(wine => {
        const status = wine.drinkingWindow.currentStatus
        return status === 'ready' || status === 'peak'
      })
      .sort((a, b) => {
        // Prioritize wines at peak, then ready
        if (a.drinkingWindow.currentStatus === 'peak' && b.drinkingWindow.currentStatus !== 'peak') {
          return -1
        }
        if (b.drinkingWindow.currentStatus === 'peak' && a.drinkingWindow.currentStatus !== 'peak') {
          return 1
        }
        
        // Then by personal rating if available
        const ratingA = a.personalRating || 0
        const ratingB = b.personalRating || 0
        return ratingB - ratingA
      })
  }
  
  /**
   * Generate drinking window context for AI recommendations
   */
  static generateDrinkingWindowContext(wine: Wine): string {
    const { drinkingWindow } = wine
    const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)
    const statusChange = DrinkingWindowService.getDaysUntilStatusChange(drinkingWindow)
    
    let context = `This wine is currently ${drinkingWindow.currentStatus.replace('_', ' ')}.`
    
    switch (drinkingWindow.currentStatus) {
      case 'too_young':
        context += ` It will be ready to drink in ${statusChange.daysUntil} days. Consider waiting for optimal enjoyment.`
        break
        
      case 'ready':
        context += ` It's ready to drink now and will enter its peak window in ${statusChange.daysUntil} days.`
        break
        
      case 'peak':
        context += ` This is an excellent time to enjoy this wine. The peak window ends in ${statusChange.daysUntil} days.`
        break
        
      case 'declining':
        context += ` While still enjoyable, it's past its peak. Consider drinking within ${statusChange.daysUntil} days.`
        break
        
      case 'over_hill':
        context += ` This wine is past its optimal drinking window. Quality may have declined, but it might still be suitable for cooking.`
        break
    }
    
    if (urgencyScore >= 80) {
      context += ' HIGH PRIORITY: This wine should be consumed soon.'
    } else if (urgencyScore >= 60) {
      context += ' MEDIUM PRIORITY: Consider enjoying this wine in the near future.'
    }
    
    return context
  }
  
  /**
   * Enhance recommendation with drinking window information
   */
  static enhanceRecommendationWithDrinkingWindow(
    recommendation: Partial<Recommendation>,
    wine: Wine
  ): Partial<Recommendation> {
    const drinkingWindowContext = this.generateDrinkingWindowContext(wine)
    const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)
    
    // Adjust confidence based on drinking window appropriateness
    let confidenceAdjustment = 0
    
    switch (wine.drinkingWindow.currentStatus) {
      case 'peak':
        confidenceAdjustment = 0.1 // Boost confidence for peak wines
        break
      case 'ready':
        confidenceAdjustment = 0.05 // Slight boost for ready wines
        break
      case 'declining':
        confidenceAdjustment = -0.05 // Slight penalty for declining wines
        break
      case 'over_hill':
        confidenceAdjustment = -0.2 // Significant penalty for over-the-hill wines
        break
      case 'too_young':
        confidenceAdjustment = -0.1 // Penalty for wines that aren't ready
        break
    }
    
    const enhancedConfidence = Math.max(0, Math.min(1, 
      (recommendation.confidence || 0.5) + confidenceAdjustment
    ))
    
    return {
      ...recommendation,
      confidence: enhancedConfidence,
      reasoning: `${recommendation.reasoning || ''}\n\nDrinking Window: ${drinkingWindowContext}`,
      context: {
        ...recommendation.context,
        urgency: urgencyScore >= 80 ? 'high' : urgencyScore >= 60 ? 'medium' : 'low'
      }
    }
  }
  
  /**
   * Get wines that pair well with food and are ready to drink
   */
  static getReadyWinesForFoodPairing(
    wines: Wine[],
    foodDescription: string,
    wineType?: Wine['type']
  ): Wine[] {
    let suitableWines = wines.filter(wine => {
      const status = wine.drinkingWindow.currentStatus
      return status === 'ready' || status === 'peak' || status === 'declining'
    })
    
    if (wineType) {
      suitableWines = suitableWines.filter(wine => wine.type === wineType)
    }
    
    // Sort by drinking window urgency and wine quality
    return suitableWines.sort((a, b) => {
      const urgencyA = DrinkingWindowService.getDrinkingUrgencyScore(a)
      const urgencyB = DrinkingWindowService.getDrinkingUrgencyScore(b)
      
      // First by urgency (higher urgency first)
      if (urgencyA !== urgencyB) {
        return urgencyB - urgencyA
      }
      
      // Then by personal rating
      const ratingA = a.personalRating || 0
      const ratingB = b.personalRating || 0
      return ratingB - ratingA
    })
  }
  
  /**
   * Filter wines by context urgency
   */
  private static filterByContextUrgency(
    winesWithUrgency: Array<{ wine: Wine; urgencyScore: number; status: string }>,
    contextUrgency: RecommendationContext['urgency']
  ) {
    switch (contextUrgency) {
      case 'high':
        // Only wines that need to be consumed soon
        return winesWithUrgency.filter(({ urgencyScore }) => urgencyScore >= 60)
        
      case 'medium':
        // Wines that are ready or approaching peak
        return winesWithUrgency.filter(({ status, urgencyScore }) => 
          ['ready', 'peak', 'declining'].includes(status) && urgencyScore >= 30
        )
        
      case 'low':
        // Any wine that's ready to drink
        return winesWithUrgency.filter(({ status }) => 
          ['ready', 'peak', 'declining'].includes(status)
        )
        
      default:
        return winesWithUrgency
    }
  }
  
  /**
   * Get status priority for sorting (lower number = higher priority)
   */
  private static getStatusPriority(status: string): number {
    switch (status) {
      case 'peak': return 1
      case 'ready': return 2
      case 'declining': return 3
      case 'too_young': return 4
      case 'over_hill': return 5
      default: return 6
    }
  }
}

/**
 * Utility functions for drinking window recommendations
 */
export class DrinkingWindowRecommendationUtils {
  /**
   * Generate recommendation explanation including drinking window
   */
  static generateRecommendationExplanation(
    wine: Wine,
    context?: RecommendationContext
  ): string {
    const drinkingWindowContext = DrinkingWindowRecommendationService.generateDrinkingWindowContext(wine)
    const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)
    
    let explanation = `${wine.name} (${wine.vintage}) from ${wine.producer} is an excellent choice. `
    
    // Add drinking window context
    explanation += drinkingWindowContext + ' '
    
    // Add context-specific advice
    if (context?.occasion) {
      explanation += `This wine is well-suited for ${context.occasion}. `
    }
    
    if (context?.foodPairing) {
      explanation += `It will pair beautifully with ${context.foodPairing}. `
    }
    
    // Add urgency advice
    if (urgencyScore >= 80) {
      explanation += 'I strongly recommend enjoying this wine soon to experience it at its best.'
    } else if (urgencyScore >= 60) {
      explanation += 'Consider enjoying this wine in the near future for optimal quality.'
    } else if (wine.drinkingWindow.currentStatus === 'peak') {
      explanation += 'This wine is at its absolute peak right now - perfect timing!'
    }
    
    return explanation
  }
  
  /**
   * Get drinking window advice for wine selection
   */
  static getDrinkingWindowAdvice(wines: Wine[]): {
    drinkNow: Wine[]
    drinkSoon: Wine[]
    canWait: Wine[]
    advice: string
  } {
    const drinkNow = wines.filter(wine => {
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      return urgency >= 80 || wine.drinkingWindow.currentStatus === 'over_hill'
    })
    
    const drinkSoon = wines.filter(wine => {
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      return urgency >= 60 && urgency < 80
    })
    
    const canWait = wines.filter(wine => {
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      const status = wine.drinkingWindow.currentStatus
      return urgency < 60 && (status === 'ready' || status === 'peak' || status === 'too_young')
    })
    
    let advice = ''
    
    if (drinkNow.length > 0) {
      advice += `You have ${drinkNow.length} wine${drinkNow.length > 1 ? 's' : ''} that should be consumed immediately. `
    }
    
    if (drinkSoon.length > 0) {
      advice += `${drinkSoon.length} wine${drinkSoon.length > 1 ? 's' : ''} should be enjoyed within the next few months. `
    }
    
    if (canWait.length > 0) {
      advice += `${canWait.length} wine${canWait.length > 1 ? 's are' : ' is'} aging well and can wait for special occasions.`
    }
    
    return { drinkNow, drinkSoon, canWait, advice }
  }
}