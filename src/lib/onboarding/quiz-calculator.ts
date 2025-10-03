/**
 * Quiz Calculation Logic
 * 
 * This module processes quiz responses and calculates taste profiles,
 * experience levels, and confidence scores based on user answers.
 */

import { QuizResponse, QuizResult, quizQuestions } from './quiz-data'
import type { FlavorProfile, GeneralPreferences } from '@/types'

export interface CalculationWeights {
  experienceWeight: number
  consistencyWeight: number
  completenessWeight: number
}

/**
 * Calculate taste profile and preferences from quiz responses
 */
export function calculateTasteProfile(responses: QuizResponse[]): QuizResult {
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]))
  
  // Determine experience level
  const experienceLevel = determineExperienceLevel(responseMap)
  
  // Calculate flavor profiles for different wine types
  const redWinePreferences = calculateRedWinePreferences(responseMap)
  const whiteWinePreferences = calculateWhiteWinePreferences(responseMap)
  const sparklingPreferences = calculateSparklingPreferences(responseMap)
  
  // Calculate general preferences
  const generalPreferences = calculateGeneralPreferences(responseMap)
  
  // Calculate confidence score based on response completeness and consistency
  const confidenceScore = calculateConfidenceScore(responses, responseMap)
  
  // Generate educational recommendations
  const educationalRecommendations = generateEducationalRecommendations(
    experienceLevel,
    responseMap
  )
  
  return {
    experienceLevel,
    redWinePreferences,
    whiteWinePreferences,
    sparklingPreferences,
    generalPreferences,
    confidenceScore,
    educationalRecommendations
  }
}

/**
 * Determine user experience level from responses
 */
function determineExperienceLevel(
  responseMap: Map<string, any>
): 'beginner' | 'intermediate' | 'advanced' {
  const explicitLevel = responseMap.get('experience-level')
  if (explicitLevel) {
    return explicitLevel
  }
  
  // Fallback: infer from other responses
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  const frequency = responseMap.get('drinking-frequency')
  
  if (wineTypesTried.includes('none') || wineTypesTried.length <= 1) {
    return 'beginner'
  }
  
  if (wineTypesTried.length >= 5 && frequency === 'weekly') {
    return 'advanced'
  }
  
  return 'intermediate'
}

/**
 * Calculate red wine preferences
 */
function calculateRedWinePreferences(responseMap: Map<string, any>): Partial<FlavorProfile> {
  const preferences: Partial<FlavorProfile> = {}
  
  // Sweetness preference
  const sweetnessPreference = responseMap.get('sweetness-preference')
  if (sweetnessPreference !== undefined) {
    preferences.sweetness = Math.max(1, sweetnessPreference - 2) // Red wines are typically drier
  }
  
  // Body preference
  const bodyPreference = responseMap.get('body-preference')
  if (bodyPreference) {
    preferences.body = bodyPreference === 'varies' ? 'medium' : bodyPreference
  }
  
  // Flavor intensity affects multiple characteristics
  const flavorIntensity = responseMap.get('flavor-intensity')
  if (flavorIntensity) {
    switch (flavorIntensity) {
      case 'subtle':
        preferences.fruitiness = 6
        preferences.earthiness = 4
        preferences.oakiness = 3
        preferences.tannins = 4
        break
      case 'moderate':
        preferences.fruitiness = 7
        preferences.earthiness = 5
        preferences.oakiness = 5
        preferences.tannins = 6
        break
      case 'bold':
        preferences.fruitiness = 8
        preferences.earthiness = 7
        preferences.oakiness = 7
        preferences.tannins = 8
        break
    }
  }
  
  // Wine types tried influences varietal preferences
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  const preferredVarietals: string[] = []
  
  if (wineTypesTried.includes('red-light')) {
    preferredVarietals.push('Pinot Noir', 'Gamay', 'Sangiovese')
  }
  if (wineTypesTried.includes('red-medium')) {
    preferredVarietals.push('Merlot', 'Grenache', 'Tempranillo')
  }
  if (wineTypesTried.includes('red-full')) {
    preferredVarietals.push('Cabernet Sauvignon', 'Syrah', 'Malbec')
  }
  
  if (preferredVarietals.length > 0) {
    preferences.preferredVarietals = preferredVarietals
  }
  
  // Regional preferences
  const regionalInterests = responseMap.get('regional-interest') || []
  const preferredRegions: string[] = []
  
  regionalInterests.forEach((region: string) => {
    switch (region) {
      case 'france':
        preferredRegions.push('Bordeaux', 'Burgundy', 'Rhône Valley')
        break
      case 'italy':
        preferredRegions.push('Tuscany', 'Piedmont', 'Veneto')
        break
      case 'spain':
        preferredRegions.push('Rioja', 'Ribera del Duero')
        break
      case 'california':
        preferredRegions.push('Napa Valley', 'Sonoma County')
        break
      case 'australia':
        preferredRegions.push('Barossa Valley', 'McLaren Vale')
        break
    }
  })
  
  if (preferredRegions.length > 0) {
    preferences.preferredRegions = preferredRegions
  }
  
  // Set defaults for missing values
  return {
    fruitiness: preferences.fruitiness || 6,
    earthiness: preferences.earthiness || 5,
    oakiness: preferences.oakiness || 5,
    acidity: preferences.acidity || 6,
    tannins: preferences.tannins || 6,
    sweetness: preferences.sweetness || 2,
    body: preferences.body || 'medium',
    preferredRegions: preferences.preferredRegions || [],
    preferredVarietals: preferences.preferredVarietals || [],
    dislikedCharacteristics: []
  }
}

/**
 * Calculate white wine preferences
 */
function calculateWhiteWinePreferences(responseMap: Map<string, any>): Partial<FlavorProfile> {
  const preferences: Partial<FlavorProfile> = {}
  
  // Sweetness preference (whites can be sweeter)
  const sweetnessPreference = responseMap.get('sweetness-preference')
  if (sweetnessPreference !== undefined) {
    preferences.sweetness = sweetnessPreference
  }
  
  // Body preference
  const bodyPreference = responseMap.get('body-preference')
  if (bodyPreference) {
    preferences.body = bodyPreference === 'varies' ? 'medium' : bodyPreference
  }
  
  // Flavor intensity affects characteristics differently for whites
  const flavorIntensity = responseMap.get('flavor-intensity')
  if (flavorIntensity) {
    switch (flavorIntensity) {
      case 'subtle':
        preferences.fruitiness = 6
        preferences.acidity = 7
        preferences.oakiness = 2
        break
      case 'moderate':
        preferences.fruitiness = 7
        preferences.acidity = 6
        preferences.oakiness = 4
        break
      case 'bold':
        preferences.fruitiness = 8
        preferences.acidity = 5
        preferences.oakiness = 6
        break
    }
  }
  
  // Wine types tried influences varietal preferences
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  const preferredVarietals: string[] = []
  
  if (wineTypesTried.includes('white-crisp')) {
    preferredVarietals.push('Sauvignon Blanc', 'Pinot Grigio', 'Albariño')
  }
  if (wineTypesTried.includes('white-rich')) {
    preferredVarietals.push('Chardonnay', 'Viognier', 'White Rioja')
  }
  
  if (preferredVarietals.length > 0) {
    preferences.preferredVarietals = preferredVarietals
  }
  
  // Set defaults
  return {
    fruitiness: preferences.fruitiness || 6,
    earthiness: preferences.earthiness || 3,
    oakiness: preferences.oakiness || 3,
    acidity: preferences.acidity || 7,
    tannins: preferences.tannins || 1,
    sweetness: preferences.sweetness || 3,
    body: preferences.body || 'medium',
    preferredRegions: preferences.preferredRegions || [],
    preferredVarietals: preferences.preferredVarietals || [],
    dislikedCharacteristics: []
  }
}

/**
 * Calculate sparkling wine preferences
 */
function calculateSparklingPreferences(responseMap: Map<string, any>): Partial<FlavorProfile> {
  const preferences: Partial<FlavorProfile> = {}
  
  // Sparkling wines are typically dry to off-dry
  const sweetnessPreference = responseMap.get('sweetness-preference')
  if (sweetnessPreference !== undefined) {
    preferences.sweetness = Math.min(5, sweetnessPreference)
  }
  
  // Sparkling wines are typically light to medium-bodied
  preferences.body = 'light'
  
  // High acidity is characteristic of sparkling wines
  preferences.acidity = 8
  
  // Wine types tried
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  const preferredVarietals: string[] = []
  
  if (wineTypesTried.includes('sparkling')) {
    preferredVarietals.push('Champagne', 'Prosecco', 'Cava', 'Crémant')
  }
  
  // Set defaults
  return {
    fruitiness: preferences.fruitiness || 6,
    earthiness: preferences.earthiness || 3,
    oakiness: preferences.oakiness || 2,
    acidity: preferences.acidity || 8,
    tannins: preferences.tannins || 1,
    sweetness: preferences.sweetness || 2,
    body: preferences.body || 'light',
    preferredRegions: preferences.preferredRegions || [],
    preferredVarietals: preferences.preferredVarietals || [],
    dislikedCharacteristics: []
  }
}

/**
 * Calculate general preferences
 */
function calculateGeneralPreferences(responseMap: Map<string, any>): Partial<GeneralPreferences> {
  const preferences: Partial<GeneralPreferences> = {}
  
  // Price range
  const priceRange = responseMap.get('price-range')
  if (priceRange && typeof priceRange === 'object' && 'min' in priceRange && 'max' in priceRange) {
    preferences.priceRange = {
      min: priceRange.min,
      max: priceRange.max,
      currency: 'USD'
    }
  }
  
  // Occasion preferences
  const occasionPreferences = responseMap.get('occasion-preferences')
  if (occasionPreferences) {
    preferences.occasionPreferences = occasionPreferences
  }
  
  // Food pairing importance
  const foodPairingImportance = responseMap.get('food-pairing-importance')
  if (foodPairingImportance !== undefined) {
    preferences.foodPairingImportance = foodPairingImportance
  }
  
  return {
    priceRange: preferences.priceRange || { min: 0, max: 50, currency: 'USD' },
    occasionPreferences: preferences.occasionPreferences || [],
    foodPairingImportance: preferences.foodPairingImportance || 5
  }
}

/**
 * Calculate confidence score based on response quality
 */
function calculateConfidenceScore(
  responses: QuizResponse[],
  responseMap: Map<string, any>
): number {
  const totalQuestions = quizQuestions.length
  const requiredQuestions = quizQuestions.filter(q => q.required).length
  const answeredRequired = quizQuestions
    .filter(q => q.required)
    .filter(q => responseMap.has(q.id)).length
  
  // Base score from completeness
  const completenessScore = answeredRequired / requiredQuestions
  
  // Bonus for answering optional questions
  const optionalAnswered = responses.length - answeredRequired
  const optionalQuestions = totalQuestions - requiredQuestions
  const optionalBonus = optionalQuestions > 0 ? (optionalAnswered / optionalQuestions) * 0.2 : 0
  
  // Consistency bonus (if user shows clear preferences)
  const consistencyBonus = calculateConsistencyBonus(responseMap)
  
  return Math.min(1, completenessScore + optionalBonus + consistencyBonus)
}

/**
 * Calculate consistency bonus based on response patterns
 */
function calculateConsistencyBonus(responseMap: Map<string, any>): number {
  let consistencyScore = 0
  
  // Check if flavor intensity aligns with body preference
  const flavorIntensity = responseMap.get('flavor-intensity')
  const bodyPreference = responseMap.get('body-preference')
  
  if (flavorIntensity && bodyPreference) {
    if (
      (flavorIntensity === 'subtle' && bodyPreference === 'light') ||
      (flavorIntensity === 'moderate' && bodyPreference === 'medium') ||
      (flavorIntensity === 'bold' && bodyPreference === 'full')
    ) {
      consistencyScore += 0.05
    }
  }
  
  // Check if experience level aligns with wine types tried
  const experienceLevel = responseMap.get('experience-level')
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  
  if (experienceLevel && wineTypesTried.length > 0) {
    if (
      (experienceLevel === 'beginner' && wineTypesTried.length <= 3) ||
      (experienceLevel === 'intermediate' && wineTypesTried.length >= 3 && wineTypesTried.length <= 6) ||
      (experienceLevel === 'advanced' && wineTypesTried.length >= 5)
    ) {
      consistencyScore += 0.05
    }
  }
  
  return Math.min(0.1, consistencyScore)
}

/**
 * Generate educational recommendations based on profile
 */
function generateEducationalRecommendations(
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  responseMap: Map<string, any>
): string[] {
  const recommendations: string[] = []
  
  const wineTypesTried = responseMap.get('wine-types-tried') || []
  const bodyPreference = responseMap.get('body-preference')
  const flavorIntensity = responseMap.get('flavor-intensity')
  
  // Experience-based recommendations
  if (experienceLevel === 'beginner') {
    recommendations.push('Start with approachable wines like Pinot Noir or Sauvignon Blanc')
    recommendations.push('Try wines from different regions to understand how location affects taste')
    
    if (!wineTypesTried.includes('sparkling')) {
      recommendations.push('Consider trying sparkling wines - they\'re food-friendly and celebratory')
    }
  } else if (experienceLevel === 'intermediate') {
    recommendations.push('Explore lesser-known grape varieties to expand your palate')
    recommendations.push('Try comparing wines from the same grape but different regions')
    
    if (wineTypesTried.length < 6) {
      recommendations.push('Branch out to wine types you haven\'t tried yet')
    }
  } else {
    recommendations.push('Focus on specific producers and vintages that match your style')
    recommendations.push('Consider wines with aging potential for your cellar')
    recommendations.push('Explore natural and biodynamic wines for unique expressions')
  }
  
  // Preference-based recommendations
  if (bodyPreference === 'light') {
    recommendations.push('Look for wines from cooler climates for elegant, lighter styles')
  } else if (bodyPreference === 'full') {
    recommendations.push('Explore wines from warmer regions for richer, more intense flavors')
  }
  
  if (flavorIntensity === 'subtle') {
    recommendations.push('Try Old World wines, which often emphasize elegance over power')
  } else if (flavorIntensity === 'bold') {
    recommendations.push('New World wines often offer the bold, fruit-forward styles you enjoy')
  }
  
  // Food pairing recommendations
  const foodPairingImportance = responseMap.get('food-pairing-importance')
  if (foodPairingImportance >= 7) {
    recommendations.push('Experiment with classic food and wine pairings to enhance both')
    recommendations.push('Consider the weight of both food and wine when pairing')
  }
  
  return recommendations.slice(0, 5) // Limit to 5 recommendations
}

/**
 * Validate quiz responses for completeness
 */
export function validateQuizResponses(responses: QuizResponse[]): {
  isValid: boolean
  missingRequired: string[]
  errors: string[]
} {
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]))
  const missingRequired: string[] = []
  const errors: string[] = []
  
  // Check required questions
  quizQuestions
    .filter(q => q.required)
    .forEach(question => {
      if (!responseMap.has(question.id)) {
        missingRequired.push(question.id)
      }
    })
  
  // Validate response values
  responses.forEach(response => {
    const question = quizQuestions.find(q => q.id === response.questionId)
    if (!question) {
      errors.push(`Unknown question: ${response.questionId}`)
      return
    }
    
    // Validate based on question type
    if (question.type === 'scale' && question.scaleConfig) {
      const value = response.value
      if (typeof value !== 'number' || 
          value < question.scaleConfig.min || 
          value > question.scaleConfig.max) {
        errors.push(`Invalid scale value for ${question.id}`)
      }
    }
    
    if (question.type === 'single-choice' && question.options) {
      const validValues = question.options.map(opt => opt.value)
      const isValidValue = validValues.some(validValue => {
        // Handle object comparison with JSON.stringify for deep equality
        if (typeof validValue === 'object' && typeof response.value === 'object') {
          return JSON.stringify(validValue) === JSON.stringify(response.value)
        }
        return validValue === response.value
      })
      
      if (!isValidValue) {
        errors.push(`Invalid option for ${question.id}`)
      }
    }
  })
  
  return {
    isValid: missingRequired.length === 0 && errors.length === 0,
    missingRequired,
    errors
  }
}