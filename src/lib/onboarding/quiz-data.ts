/**
 * Taste Profile Quiz Data and Configuration
 * 
 * This file contains the quiz questions, scoring logic, and educational content
 * for the onboarding taste profile quiz. Questions are designed to be approachable
 * and beginner-friendly while gathering meaningful preference data.
 */

export interface QuizQuestion {
  id: string
  type: 'single-choice' | 'multiple-choice' | 'scale' | 'preference-grid'
  category: 'experience' | 'preferences' | 'lifestyle' | 'food-pairing'
  question: string
  description?: string
  options?: QuizOption[]
  scaleConfig?: {
    min: number
    max: number
    minLabel: string
    maxLabel: string
    step?: number
  }
  gridConfig?: {
    items: string[]
    scaleLabels: string[]
  }
  required: boolean
  educationalNote?: string
}

export interface QuizOption {
  id: string
  label: string
  description?: string
  value: any
  educationalNote?: string
}

export interface QuizResponse {
  questionId: string
  value: any
  timestamp: Date
}

export interface QuizResult {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  redWinePreferences: Partial<FlavorProfile>
  whiteWinePreferences: Partial<FlavorProfile>
  sparklingPreferences: Partial<FlavorProfile>
  generalPreferences: Partial<GeneralPreferences>
  confidenceScore: number
  educationalRecommendations: string[]
}

interface FlavorProfile {
  fruitiness: number
  earthiness: number
  oakiness: number
  acidity: number
  tannins: number
  sweetness: number
  body: 'light' | 'medium' | 'full'
  preferredRegions: string[]
  preferredVarietals: string[]
  dislikedCharacteristics: string[]
}

interface GeneralPreferences {
  priceRange: {
    min: number
    max: number
    currency: string
  }
  occasionPreferences: string[]
  foodPairingImportance: number
}

/**
 * Quiz Questions Configuration
 * Designed to be approachable for beginners while gathering meaningful data
 */
export const quizQuestions: QuizQuestion[] = [
  // 12 Core questions aligned to the long-term profile model
  {
    id: 'experience-level',
    type: 'single-choice',
    category: 'experience',
    question: 'What best describes your wine experience?',
    options: [
      { id: 'novice', label: 'New to wine', value: 'novice' },
      { id: 'intermediate', label: 'Comfortable exploring', value: 'intermediate' },
      { id: 'expert', label: 'Wine expert', value: 'expert' }
    ],
    required: true
  },
  {
    id: 'sweetness',
    type: 'scale',
    category: 'preferences',
    question: 'Sweetness tolerance',
    description: 'Bone-dry ↔ noticeable sweetness',
    scaleConfig: { min: 0, max: 10, minLabel: 'Bone-dry', maxLabel: 'Sweet', step: 1 },
    required: true
  },
  {
    id: 'acidity',
    type: 'scale',
    category: 'preferences',
    question: 'Acidity (refreshment) tolerance',
    description: 'Mellow ↔ lemonade-like zing',
    scaleConfig: { min: 0, max: 10, minLabel: 'Mellow', maxLabel: 'Zippy', step: 1 },
    required: true
  },
  {
    id: 'tannin',
    type: 'scale',
    category: 'preferences',
    question: 'Tannin tolerance (drying/tea-like grip)',
    scaleConfig: { min: 0, max: 10, minLabel: 'Low', maxLabel: 'High', step: 1 },
    required: true
  },
  {
    id: 'bitterness',
    type: 'scale',
    category: 'preferences',
    question: 'Bitterness sensitivity',
    scaleConfig: { min: 0, max: 10, minLabel: 'Sensitive', maxLabel: 'Enjoy some', step: 1 },
    required: false
  },
  {
    id: 'body',
    type: 'scale',
    category: 'preferences',
    question: 'Body preference',
    description: 'Light ↔ full (skim ↔ whole milk mouthfeel)',
    scaleConfig: { min: 0, max: 10, minLabel: 'Light', maxLabel: 'Full', step: 1 },
    required: true
  },
  {
    id: 'oak_and_butter',
    type: 'single-choice',
    category: 'preferences',
    question: 'Oak/vanilla and buttery notes',
    options: [
      { id: 'crisp', label: 'Prefer crisp/stainless (no butter/oak)', value: 'stainless' },
      { id: 'neutral', label: 'Some neutral oak OK', value: 'neutral' },
      { id: 'oaky_buttery', label: 'I enjoy vanilla/toast/buttery', value: 'oaky_buttery' }
    ],
    required: true
  },
  {
    id: 'sparkling',
    type: 'single-choice',
    category: 'preferences',
    question: 'Sparkling sweetness',
    options: [
      { id: 'brut', label: 'Brut-dry', value: 'Brut' },
      { id: 'extra_brut', label: 'Extra Brut', value: 'Extra Brut' },
      { id: 'demi_sec', label: 'Hint of sweetness (Demi-Sec)', value: 'Demi-Sec' }
    ],
    required: false
  },
  {
    id: 'sparkle_intensity',
    type: 'scale',
    category: 'preferences',
    question: 'Bubble intensity preference',
    scaleConfig: { min: 0, max: 10, minLabel: 'Gentle', maxLabel: 'Vigorous', step: 1 },
    required: false
  },
  {
    id: 'aroma_likes',
    type: 'multiple-choice',
    category: 'preferences',
    question: 'Pick up to 2 aroma families you love lately',
    options: [
      { id: 'citrus', label: 'Citrus', value: 'citrus' },
      { id: 'stone_fruit', label: 'Stone fruit', value: 'stone_fruit' },
      { id: 'tropical', label: 'Tropical', value: 'tropical' },
      { id: 'red_fruit', label: 'Red fruit', value: 'red_fruit' },
      { id: 'black_fruit', label: 'Black fruit', value: 'black_fruit' },
      { id: 'floral', label: 'Floral', value: 'floral' },
      { id: 'herbal_green', label: 'Herbal/green', value: 'herbal_green' },
      { id: 'pepper_spice', label: 'Pepper/spice', value: 'pepper_spice' },
      { id: 'earth_mineral', label: 'Earth/mineral', value: 'earth_mineral' },
      { id: 'oak_vanilla_smoke', label: 'Oak/vanilla/smoke', value: 'oak_vanilla_smoke' },
      { id: 'dairy_butter', label: 'Dairy/butter', value: 'dairy_butter' },
      { id: 'honey_oxidative', label: 'Honey/oxidative', value: 'honey_oxidative' }
    ],
    required: false
  },
  {
    id: 'dislikes',
    type: 'multiple-choice',
    category: 'preferences',
    question: 'Any characteristics to avoid?',
    options: [
      { id: 'green_bell_pepper', label: 'Green bell pepper (pyrazine)', value: 'green_bell_pepper' },
      { id: 'buttery', label: 'Buttery/diacetyl', value: 'buttery' },
      { id: 'smoky', label: 'Smoky/oak', value: 'smoky' },
      { id: 'high_alcohol', label: 'High alcohol heat', value: 'high_alcohol' },
      { id: 'sweet', label: 'Noticeable sweetness', value: 'sweet' }
    ],
    required: false
  },
  {
    id: 'occasions',
    type: 'multiple-choice',
    category: 'lifestyle',
    question: 'Top two occasions you care about now',
    options: [
      { id: 'everyday', label: 'Everyday', value: 'everyday' },
      { id: 'hot_day_patio', label: 'Hot day/patio', value: 'hot_day_patio' },
      { id: 'cozy_winter', label: 'Cozy winter night', value: 'cozy_winter' },
      { id: 'spicy_food_night', label: 'Spicy food night', value: 'spicy_food_night' },
      { id: 'steak_night', label: 'Steak night', value: 'steak_night' },
      { id: 'seafood_sushi', label: 'Seafood/sushi', value: 'seafood_sushi' },
      { id: 'pizza_pasta', label: 'Pizza/pasta', value: 'pizza_pasta' },
      { id: 'celebration_toast', label: 'Celebration/toast', value: 'celebration_toast' },
      { id: 'dessert_night', label: 'Dessert night', value: 'dessert_night' },
      { id: 'aperitif', label: 'Aperitif', value: 'aperitif' }
    ],
    required: false
  },
  {
    id: 'food_calibrators',
    type: 'scale',
    category: 'food-pairing',
    question: 'Spice/heat level you enjoy (0–5)',
    scaleConfig: { min: 0, max: 5, minLabel: 'None', maxLabel: 'Very spicy', step: 1 },
    required: false
  },
  {
    id: 'exploration_budget',
    type: 'single-choice',
    category: 'preferences',
    question: 'Exploration vs safe + typical budget lane',
    options: [
      { id: 'safe_weeknight', label: 'Play it safe • Weeknight', value: { novelty: 0.2, budgetTier: 'weeknight' } },
      { id: 'mix_weekend', label: 'Mix of both • Weekend', value: { novelty: 0.5, budgetTier: 'weekend' } },
      { id: 'adventurous_celebration', label: 'Adventurous • Celebration', value: { novelty: 0.8, budgetTier: 'celebration' } }
    ],
    required: true
  }
]

// Optional expert-only questions (appended if experience-level === 'expert')
export const expertQuestions: QuizQuestion[] = [
  {
    id: 'expert_regions_liked',
    type: 'multiple-choice',
    category: 'experience',
    question: 'Regions you often enjoy (optional)',
    options: [
      { id: 'bordeaux', label: 'Bordeaux', value: 'Bordeaux' },
      { id: 'burgundy', label: 'Burgundy', value: 'Burgundy' },
      { id: 'rhine', label: 'Rhine/Mosel', value: 'Rhine' },
      { id: 'tuscany', label: 'Tuscany', value: 'Tuscany' },
      { id: 'piedmont', label: 'Piedmont', value: 'Piedmont' },
      { id: 'napa', label: 'Napa Valley', value: 'Napa Valley' },
      { id: 'willamette', label: 'Willamette', value: 'Willamette' }
    ],
    required: false
  },
  {
    id: 'expert_grapes_liked',
    type: 'multiple-choice',
    category: 'experience',
    question: 'Grapes/styles you seek out (optional)',
    options: [
      { id: 'pinot_noir', label: 'Pinot Noir', value: 'Pinot Noir' },
      { id: 'cabernet', label: 'Cabernet Sauvignon', value: 'Cabernet Sauvignon' },
      { id: 'nebbiolo', label: 'Nebbiolo', value: 'Nebbiolo' },
      { id: 'chardonnay', label: 'Chardonnay', value: 'Chardonnay' },
      { id: 'sauv_blanc', label: 'Sauvignon Blanc', value: 'Sauvignon Blanc' },
      { id: 'riesling', label: 'Riesling', value: 'Riesling' },
      { id: 'syrah', label: 'Syrah/Shiraz', value: 'Syrah' }
    ],
    required: false
  },
  {
    id: 'expert_sensitivities',
    type: 'multiple-choice',
    category: 'experience',
    question: 'Any sensitivities? (optional)',
    options: [
      { id: 'pyrazine', label: 'Pyrazine (green pepper)', value: 'pyrazine' },
      { id: 'diacetyl', label: 'Diacetyl (buttery)', value: 'diacetyl' },
      { id: 'brett', label: 'Brettanomyces (barnyard)', value: 'brett' },
      { id: 'tdn', label: 'TDN (petrol)', value: 'tdn' }
    ],
    required: false
  }
]

/**
 * Educational content for different experience levels
 */
export const educationalContent = {
  beginner: {
    welcome: 'Welcome to your wine journey! We\'ll help you discover wines you\'ll love while learning about what makes each one special.',
    tips: [
      'Start with lighter, more approachable wines and work your way up to bolder styles',
      'Don\'t worry about "right" or "wrong" - your taste preferences are valid',
      'Keep notes about wines you try to help refine your preferences',
      'Wine is meant to be enjoyed - there\'s no need to be intimidated'
    ]
  },
  intermediate: {
    welcome: 'Great to have a fellow wine lover! We\'ll help you discover new styles and deepen your wine knowledge.',
    tips: [
      'Try wines from different regions to understand terroir',
      'Experiment with food pairings to enhance both wine and food',
      'Consider the vintage and how it affects the wine\'s character',
      'Don\'t be afraid to step outside your comfort zone'
    ]
  },
  advanced: {
    welcome: 'Excellent! We\'ll provide detailed recommendations and help you discover rare gems for your collection.',
    tips: [
      'Focus on specific producers and vintages that match your style',
      'Consider cellar-worthy wines for future enjoyment',
      'Explore lesser-known regions and grape varieties',
      'Track your tasting notes to refine your palate further'
    ]
  }
}