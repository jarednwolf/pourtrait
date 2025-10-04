/**
 * Wine Knowledge Base Service
 * 
 * Provides comprehensive wine knowledge for AI recommendations, including
 * wine characteristics, pairing information, regional data, and expert insights.
 */

import { Wine } from '@/types'
import { ExternalWineDataService } from './external-wine-data'

// ============================================================================
// Wine Knowledge Base Types
// ============================================================================

export interface WineCharacteristics {
  body: 'light' | 'medium' | 'full'
  tannins: 'low' | 'medium' | 'high'
  acidity: 'low' | 'medium' | 'high'
  sweetness: 'bone-dry' | 'dry' | 'off-dry' | 'medium-sweet' | 'sweet'
  alcohol: 'low' | 'medium' | 'high'
  complexity: 'simple' | 'moderate' | 'complex'
  agingPotential: 'drink-now' | 'short-term' | 'medium-term' | 'long-term'
}

export interface RegionalProfile {
  region: string
  country: string
  climate: 'cool' | 'moderate' | 'warm' | 'hot'
  soilTypes: string[]
  primaryVarietals: string[]
  wineStyles: string[]
  characteristics: WineCharacteristics
  notableProducers: string[]
  typicalPriceRange: {
    min: number
    max: number
    currency: string
  }
}

export interface VarietalProfile {
  name: string
  type: 'red' | 'white' | 'rosé'
  characteristics: WineCharacteristics
  flavorProfile: {
    primaryFlavors: string[]
    secondaryFlavors: string[]
    tertiaryFlavors: string[]
  }
  foodPairings: string[]
  servingTemperature: {
    min: number
    max: number
  }
  glassType: string
  regions: string[]
}

export interface FoodPairingRule {
  foodCategory: string
  recommendedWineTypes: string[]
  recommendedCharacteristics: Partial<WineCharacteristics>
  avoidCharacteristics: Partial<WineCharacteristics>
  reasoning: string
  examples: Array<{
    food: string
    wine: string
    explanation: string
  }>
}

export interface WineKnowledge {
  wine: Wine
  characteristics: WineCharacteristics
  regionalProfile?: RegionalProfile
  varietalProfiles: VarietalProfile[]
  expertInsights: string[]
  pairingRecommendations: string[]
  servingRecommendations: {
    temperature: string
    glassware: string
    decanting?: string
    timing: string
  }
  confidenceScore: number
}

// ============================================================================
// Wine Knowledge Base Data
// ============================================================================

const REGIONAL_PROFILES: RegionalProfile[] = [
  {
    region: 'Bordeaux',
    country: 'France',
    climate: 'moderate',
    soilTypes: ['gravel', 'clay', 'limestone'],
    primaryVarietals: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'],
    wineStyles: ['Left Bank Blend', 'Right Bank Blend', 'Sauternes'],
    characteristics: {
      body: 'full',
      tannins: 'high',
      acidity: 'medium',
      sweetness: 'dry',
      alcohol: 'medium',
      complexity: 'complex',
      agingPotential: 'long-term'
    },
    notableProducers: ['Château Margaux', 'Château Latour', 'Château Pétrus'],
    typicalPriceRange: { min: 25, max: 500, currency: 'USD' }
  },
  {
    region: 'Burgundy',
    country: 'France',
    climate: 'cool',
    soilTypes: ['limestone', 'clay', 'marl'],
    primaryVarietals: ['Pinot Noir', 'Chardonnay'],
    wineStyles: ['Village', 'Premier Cru', 'Grand Cru'],
    characteristics: {
      body: 'medium',
      tannins: 'medium',
      acidity: 'high',
      sweetness: 'dry',
      alcohol: 'medium',
      complexity: 'complex',
      agingPotential: 'medium-term'
    },
    notableProducers: ['Domaine de la Romanée-Conti', 'Louis Jadot', 'Joseph Drouhin'],
    typicalPriceRange: { min: 30, max: 1000, currency: 'USD' }
  },
  {
    region: 'Napa Valley',
    country: 'United States',
    climate: 'warm',
    soilTypes: ['volcanic', 'alluvial', 'sedimentary'],
    primaryVarietals: ['Cabernet Sauvignon', 'Chardonnay', 'Merlot'],
    wineStyles: ['Napa Cabernet', 'Napa Chardonnay', 'Bordeaux Blend'],
    characteristics: {
      body: 'full',
      tannins: 'high',
      acidity: 'medium',
      sweetness: 'dry',
      alcohol: 'high',
      complexity: 'complex',
      agingPotential: 'long-term'
    },
    notableProducers: ['Screaming Eagle', 'Opus One', 'Caymus'],
    typicalPriceRange: { min: 40, max: 800, currency: 'USD' }
  }
]

const VARIETAL_PROFILES: VarietalProfile[] = [
  {
    name: 'Cabernet Sauvignon',
    type: 'red',
    characteristics: {
      body: 'full',
      tannins: 'high',
      acidity: 'medium',
      sweetness: 'dry',
      alcohol: 'high',
      complexity: 'complex',
      agingPotential: 'long-term'
    },
    flavorProfile: {
      primaryFlavors: ['blackcurrant', 'blackberry', 'plum'],
      secondaryFlavors: ['cedar', 'tobacco', 'vanilla'],
      tertiaryFlavors: ['leather', 'earth', 'graphite']
    },
    foodPairings: ['red meat', 'lamb', 'aged cheese', 'dark chocolate'],
    servingTemperature: { min: 16, max: 18 },
    glassType: 'Bordeaux glass',
    regions: ['Bordeaux', 'Napa Valley', 'Coonawarra', 'Maipo Valley']
  },
  {
    name: 'Pinot Noir',
    type: 'red',
    characteristics: {
      body: 'medium',
      tannins: 'medium',
      acidity: 'high',
      sweetness: 'dry',
      alcohol: 'medium',
      complexity: 'complex',
      agingPotential: 'medium-term'
    },
    flavorProfile: {
      primaryFlavors: ['cherry', 'raspberry', 'strawberry'],
      secondaryFlavors: ['rose', 'violet', 'spice'],
      tertiaryFlavors: ['earth', 'mushroom', 'forest floor']
    },
    foodPairings: ['salmon', 'duck', 'mushrooms', 'soft cheese'],
    servingTemperature: { min: 14, max: 16 },
    glassType: 'Burgundy glass',
    regions: ['Burgundy', 'Oregon', 'Central Otago', 'Russian River']
  },
  {
    name: 'Chardonnay',
    type: 'white',
    characteristics: {
      body: 'medium',
      tannins: 'low',
      acidity: 'medium',
      sweetness: 'dry',
      alcohol: 'medium',
      complexity: 'moderate',
      agingPotential: 'medium-term'
    },
    flavorProfile: {
      primaryFlavors: ['apple', 'pear', 'citrus'],
      secondaryFlavors: ['vanilla', 'butter', 'toast'],
      tertiaryFlavors: ['honey', 'nuts', 'mineral']
    },
    foodPairings: ['lobster', 'chicken', 'cream sauces', 'soft cheese'],
    servingTemperature: { min: 10, max: 12 },
    glassType: 'Chardonnay glass',
    regions: ['Burgundy', 'Napa Valley', 'Margaret River', 'Sonoma Coast']
  }
]

const _FOOD_PAIRING_RULES: FoodPairingRule[] = [
  {
    foodCategory: 'Red Meat',
    recommendedWineTypes: ['red'],
    recommendedCharacteristics: {
      body: 'full',
      tannins: 'high',
      alcohol: 'medium'
    },
    avoidCharacteristics: {
      body: 'light',
      tannins: 'low'
    },
    reasoning: 'High tannins complement the protein and fat in red meat',
    examples: [
      {
        food: 'Grilled steak',
        wine: 'Cabernet Sauvignon',
        explanation: 'Bold tannins match the richness of the meat'
      },
      {
        food: 'Lamb chops',
        wine: 'Syrah/Shiraz',
        explanation: 'Spicy notes complement the gamey flavors'
      }
    ]
  },
  {
    foodCategory: 'Seafood',
    recommendedWineTypes: ['white', 'rosé', 'sparkling'],
    recommendedCharacteristics: {
      acidity: 'high',
      body: 'light'
    },
    avoidCharacteristics: {
      tannins: 'high',
      body: 'full'
    },
    reasoning: 'High acidity cuts through richness and complements delicate flavors',
    examples: [
      {
        food: 'Grilled salmon',
        wine: 'Pinot Noir',
        explanation: 'Light red wine bridges fish and meat characteristics'
      },
      {
        food: 'Oysters',
        wine: 'Champagne',
        explanation: 'Bubbles and acidity cleanse the palate'
      }
    ]
  }
]

// ============================================================================
// Wine Knowledge Base Service
// ============================================================================

export class WineKnowledgeBaseService {
  /**
   * Get comprehensive knowledge about a wine
   */
  static async getWineKnowledge(wine: Wine): Promise<WineKnowledge> {
    // Analyze wine characteristics
    const characteristics = this.analyzeWineCharacteristics(wine)
    
    // Get regional profile
    const regionalProfile = this.getRegionalProfile(wine.region, wine.country)
    
    // Get varietal profiles
    const varietalProfiles = this.getVarietalProfiles(wine.varietal)
    
    // Generate expert insights
    const expertInsights = this.generateExpertInsights(wine, characteristics, regionalProfile, varietalProfiles)
    
    // Get pairing recommendations
    const pairingRecommendations = this.getFoodPairingRecommendations(characteristics, varietalProfiles)
    
    // Get serving recommendations
    const servingRecommendations = this.getServingRecommendations(wine, varietalProfiles)
    
    // Calculate confidence score
    const confidenceScore = this.calculateKnowledgeConfidence(wine, regionalProfile, varietalProfiles)

    return {
      wine,
      characteristics,
      regionalProfile,
      varietalProfiles,
      expertInsights,
      pairingRecommendations,
      servingRecommendations,
      confidenceScore
    }
  }

  /**
   * Analyze wine characteristics based on wine data and external information
   */
  private static analyzeWineCharacteristics(wine: Wine): WineCharacteristics {
    // Start with defaults based on wine type
    let characteristics = this.getDefaultCharacteristics(wine.type)

    // Refine based on varietal
    if (wine.varietal && wine.varietal.length > 0) {
      const primaryVarietal = wine.varietal[0]
      const varietalProfile = VARIETAL_PROFILES.find(v => 
        v.name.toLowerCase() === primaryVarietal.toLowerCase()
      )
      
      if (varietalProfile) {
        characteristics = { ...characteristics, ...varietalProfile.characteristics }
      }
    }

    // Refine based on region
    const regionalProfile = this.getRegionalProfile(wine.region, wine.country)
    if (regionalProfile) {
      // Regional climate affects characteristics
      if (regionalProfile.climate === 'warm' || regionalProfile.climate === 'hot') {
        characteristics.alcohol = 'high'
        characteristics.body = 'full'
      } else if (regionalProfile.climate === 'cool') {
        characteristics.acidity = 'high'
        characteristics.alcohol = 'medium'
      }
    }

    // Refine based on vintage (older wines may have different characteristics)
    const age = new Date().getFullYear() - wine.vintage
    if (age > 10) {
      characteristics.complexity = 'complex'
      if (wine.type === 'red') {
        characteristics.tannins = 'medium' // Tannins soften with age
      }
    }

    // Use external data if available
    if (wine.external_data.alcoholContent) {
      if (wine.external_data.alcoholContent < 12) {
        characteristics.alcohol = 'low'
      } else if (wine.external_data.alcoholContent > 14.5) {
        characteristics.alcohol = 'high'
      } else {
        characteristics.alcohol = 'medium'
      }
    }

    return characteristics
  }

  /**
   * Get default characteristics based on wine type
   */
  private static getDefaultCharacteristics(type: Wine['type']): WineCharacteristics {
    switch (type) {
      case 'red':
        return {
          body: 'medium',
          tannins: 'medium',
          acidity: 'medium',
          sweetness: 'dry',
          alcohol: 'medium',
          complexity: 'moderate',
          agingPotential: 'medium-term'
        }
      
      case 'white':
        return {
          body: 'light',
          tannins: 'low',
          acidity: 'high',
          sweetness: 'dry',
          alcohol: 'medium',
          complexity: 'moderate',
          agingPotential: 'short-term'
        }
      
      case 'rosé':
        return {
          body: 'light',
          tannins: 'low',
          acidity: 'high',
          sweetness: 'dry',
          alcohol: 'medium',
          complexity: 'simple',
          agingPotential: 'drink-now'
        }
      
      case 'sparkling':
        return {
          body: 'light',
          tannins: 'low',
          acidity: 'high',
          sweetness: 'dry',
          alcohol: 'medium',
          complexity: 'moderate',
          agingPotential: 'short-term'
        }
      
      default:
        return {
          body: 'medium',
          tannins: 'medium',
          acidity: 'medium',
          sweetness: 'dry',
          alcohol: 'medium',
          complexity: 'moderate',
          agingPotential: 'medium-term'
        }
    }
  }

  /**
   * Get regional profile for a wine
   */
  private static getRegionalProfile(region: string, country: string): RegionalProfile | undefined {
    return REGIONAL_PROFILES.find(profile => 
      profile.region.toLowerCase() === region.toLowerCase() ||
      profile.country.toLowerCase() === country.toLowerCase()
    )
  }

  /**
   * Get varietal profiles for wine varietals
   */
  private static getVarietalProfiles(varietals: string[]): VarietalProfile[] {
    return varietals
      .map(varietal => 
        VARIETAL_PROFILES.find(profile => 
          profile.name.toLowerCase() === varietal.toLowerCase()
        )
      )
      .filter(profile => profile !== undefined) as VarietalProfile[]
  }

  /**
   * Generate expert insights about the wine
   */
  private static generateExpertInsights(
    wine: Wine,
    characteristics: WineCharacteristics,
    regionalProfile?: RegionalProfile,
    varietalProfiles?: VarietalProfile[]
  ): string[] {
    const insights: string[] = []

    // Regional insights
    if (regionalProfile) {
      insights.push(
        `This wine comes from ${regionalProfile.region}, known for its ${regionalProfile.climate} climate and ${regionalProfile.soilTypes.join(', ')} soils, which contribute to its distinctive character.`
      )
    }

    // Varietal insights
    if (varietalProfiles && varietalProfiles.length > 0) {
      const primaryVarietal = varietalProfiles[0]
      insights.push(
        `The ${primaryVarietal.name} grape brings ${primaryVarietal.flavorProfile.primaryFlavors.join(', ')} flavors with ${primaryVarietal.characteristics.body} body and ${primaryVarietal.characteristics.tannins} tannins.`
      )
    }

    // Aging insights
    const age = new Date().getFullYear() - wine.vintage
    if (age < 3) {
      insights.push('This is a young wine that may benefit from some additional aging or decanting.')
    } else if (age > 15) {
      insights.push('This mature wine should be approaching or at its peak drinking window.')
    }

    // Professional rating insights
    if (wine.external_data.professionalRatings && wine.external_data.professionalRatings.length > 0) {
      const avgRating = wine.external_data.professionalRatings.reduce((sum, rating) => 
        sum + (rating.score / rating.maxScore), 0
      ) / wine.external_data.professionalRatings.length

      if (avgRating > 0.9) {
        insights.push('This wine has received exceptional ratings from professional critics, indicating outstanding quality.')
      } else if (avgRating > 0.85) {
        insights.push('Professional critics have rated this wine highly, suggesting excellent quality and character.')
      }
    }

    return insights
  }

  /**
   * Get food pairing recommendations
   */
  private static getFoodPairingRecommendations(
    characteristics: WineCharacteristics,
    varietalProfiles: VarietalProfile[]
  ): string[] {
    const recommendations: string[] = []

    // Use varietal-specific pairings if available
    if (varietalProfiles.length > 0) {
      const primaryVarietal = varietalProfiles[0]
      recommendations.push(...primaryVarietal.foodPairings)
    }

    // Add characteristic-based pairings
    if (characteristics.tannins === 'high') {
      recommendations.push('red meat', 'aged cheeses', 'grilled foods')
    }

    if (characteristics.acidity === 'high') {
      recommendations.push('seafood', 'salads', 'tomato-based dishes')
    }

    if (characteristics.body === 'full') {
      recommendations.push('rich sauces', 'hearty stews', 'roasted meats')
    } else if (characteristics.body === 'light') {
      recommendations.push('light appetizers', 'delicate fish', 'fresh vegetables')
    }

    // Remove duplicates and return unique recommendations
    return [...new Set(recommendations)]
  }

  /**
   * Get serving recommendations
   */
  private static getServingRecommendations(
    wine: Wine,
    varietalProfiles: VarietalProfile[]
  ): WineKnowledge['servingRecommendations'] {
    let temperature = '12-14°C'
    let glassware = 'Standard wine glass'
    let decanting: string | undefined
    let timing = 'Serve immediately'

    // Use varietal-specific recommendations if available
    if (varietalProfiles.length > 0) {
      const primaryVarietal = varietalProfiles[0]
      temperature = `${primaryVarietal.servingTemperature.min}-${primaryVarietal.servingTemperature.max}°C`
      glassware = primaryVarietal.glassType
    }

    // Use external data if available
    if (wine.external_data.servingTemperature) {
      temperature = `${wine.external_data.servingTemperature.min}-${wine.external_data.servingTemperature.max}°C`
    }

    if (wine.external_data.decantingTime) {
      decanting = `Decant for ${wine.external_data.decantingTime} minutes before serving`
    }

    // Age-based recommendations
    const age = new Date().getFullYear() - wine.vintage
    if (wine.type === 'red' && age > 8) {
      decanting = decanting || 'Consider decanting to remove sediment and allow the wine to breathe'
    }

    if (wine.type === 'sparkling') {
      timing = 'Serve well-chilled and consume promptly after opening'
    }

    return {
      temperature,
      glassware,
      decanting,
      timing
    }
  }

  /**
   * Calculate confidence score for wine knowledge
   */
  private static calculateKnowledgeConfidence(
    wine: Wine,
    regionalProfile?: RegionalProfile,
    varietalProfiles?: VarietalProfile[]
  ): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on available data
    if (regionalProfile) {confidence += 0.2}
    if (varietalProfiles && varietalProfiles.length > 0) {confidence += 0.2}
    if (wine.external_data.professionalRatings && wine.external_data.professionalRatings.length > 0) {confidence += 0.1}
    if (wine.external_data.tastingNotes) {confidence += 0.1}
    if (wine.external_data.lastUpdated) {
      const freshness = ExternalWineDataService.getDataFreshness(wine.external_data.lastUpdated)
      confidence += freshness * 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Search wine knowledge base for similar wines
   */
  static findSimilarWines(
    targetCharacteristics: WineCharacteristics,
    wines: Wine[]
  ): Array<{ wine: Wine; similarity: number }> {
    return wines
      .map(wine => ({
        wine,
        similarity: this.calculateSimilarity(targetCharacteristics, this.analyzeWineCharacteristics(wine))
      }))
      .filter(result => result.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * Calculate similarity between wine characteristics
   */
  private static calculateSimilarity(
    characteristics1: WineCharacteristics,
    characteristics2: WineCharacteristics
  ): number {
    const weights = {
      body: 0.2,
      tannins: 0.2,
      acidity: 0.2,
      sweetness: 0.15,
      alcohol: 0.1,
      complexity: 0.1,
      agingPotential: 0.05
    }

    let similarity = 0
    let totalWeight = 0

    for (const [key, weight] of Object.entries(weights)) {
      const char1 = characteristics1[key as keyof WineCharacteristics]
      const char2 = characteristics2[key as keyof WineCharacteristics]
      
      if (char1 === char2) {
        similarity += weight
      }
      totalWeight += weight
    }

    return similarity / totalWeight
  }

  /**
   * Get wine education content for beginners
   */
  static getWineEducation(wine: Wine): {
    basicInfo: string[]
    terminology: Array<{ term: string; definition: string }>
    tips: string[]
  } {
    const basicInfo: string[] = []
    const terminology: Array<{ term: string; definition: string }> = []
    const tips: string[] = []

    // Basic wine information
    basicInfo.push(`This is a ${wine.type} wine made from ${wine.varietal.join(', ')} grapes.`)
    basicInfo.push(`It was produced in ${wine.region}, ${wine.country} in ${wine.vintage}.`)

    // Wine terminology
    terminology.push(
      { term: 'Vintage', definition: 'The year the grapes were harvested' },
      { term: 'Varietal', definition: 'The type of grape used to make the wine' },
      { term: 'Region', definition: 'The geographic area where the wine was produced' },
      { term: 'Tannins', definition: 'Compounds that create a dry, astringent feeling in your mouth' },
      { term: 'Acidity', definition: 'What makes wine taste crisp and refreshing' }
    )

    // Beginner tips
    tips.push('Start by smelling the wine before tasting to identify aromas.')
    tips.push('Take small sips and let the wine coat your palate.')
    tips.push('Notice how the wine feels in your mouth - light, medium, or full-bodied.')
    tips.push('Pay attention to the finish - how long the flavors last after swallowing.')

    return { basicInfo, terminology, tips }
  }
}