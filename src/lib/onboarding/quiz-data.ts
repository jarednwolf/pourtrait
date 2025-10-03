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
  // Experience Level Assessment
  {
    id: 'experience-level',
    type: 'single-choice',
    category: 'experience',
    question: 'How would you describe your wine experience?',
    description: 'This helps us tailor our recommendations to your comfort level.',
    options: [
      {
        id: 'beginner',
        label: 'New to wine',
        description: 'I&apos;m just starting to explore wine and want to learn',
        value: 'beginner',
        educationalNote: 'Perfect! We&apos;ll focus on approachable wines and educational content.'
      },
      {
        id: 'casual',
        label: 'Casual wine drinker',
        description: 'I enjoy wine occasionally but want to learn more',
        value: 'intermediate',
        educationalNote: 'Great! We&apos;ll help you discover new styles and deepen your knowledge.'
      },
      {
        id: 'enthusiast',
        label: 'Wine enthusiast',
        description: 'I have experience with different wines and regions',
        value: 'advanced',
        educationalNote: 'Excellent! We&apos;ll provide detailed recommendations and advanced insights.'
      }
    ],
    required: true,
    educationalNote: 'There&apos;s no wrong answer here - everyone starts somewhere, and wine is meant to be enjoyed at any level!'
  },

  // Wine Frequency and Context
  {
    id: 'drinking-frequency',
    type: 'single-choice',
    category: 'lifestyle',
    question: 'How often do you typically drink wine?',
    description: 'This helps us understand your wine consumption patterns.',
    options: [
      { id: 'rarely', label: 'Rarely (special occasions only)', value: 'rarely' },
      { id: 'monthly', label: 'A few times a month', value: 'monthly' },
      { id: 'weekly', label: 'Weekly', value: 'weekly' },
      { id: 'daily', label: 'Most days', value: 'daily' }
    ],
    required: true
  },

  // Price Comfort Zone
  {
    id: 'price-range',
    type: 'single-choice',
    category: 'preferences',
    question: 'What\'s your typical budget for a bottle of wine?',
    description: 'We\'ll recommend wines that fit comfortably within your budget.',
    options: [
      { id: 'budget', label: 'Under $15', value: { min: 0, max: 15 } },
      { id: 'moderate', label: '$15 - $30', value: { min: 15, max: 30 } },
      { id: 'premium', label: '$30 - $60', value: { min: 30, max: 60 } },
      { id: 'luxury', label: '$60+', value: { min: 60, max: 200 } },
      { id: 'varies', label: 'It varies by occasion', value: { min: 0, max: 100 } }
    ],
    required: true,
    educationalNote: 'Great wines exist at every price point - we\'ll help you find the best value for your budget.'
  },

  // Wine Types Experience
  {
    id: 'wine-types-tried',
    type: 'multiple-choice',
    category: 'experience',
    question: 'Which types of wine have you tried and enjoyed?',
    description: 'Select all that apply. Don\'t worry if you haven\'t tried many - we\'ll help you explore!',
    options: [
      { id: 'red-light', label: 'Light red wines (like Pinot Noir)', value: 'red-light' },
      { id: 'red-medium', label: 'Medium-bodied reds (like Merlot)', value: 'red-medium' },
      { id: 'red-full', label: 'Full-bodied reds (like Cabernet Sauvignon)', value: 'red-full' },
      { id: 'white-crisp', label: 'Crisp white wines (like Sauvignon Blanc)', value: 'white-crisp' },
      { id: 'white-rich', label: 'Rich white wines (like Chardonnay)', value: 'white-rich' },
      { id: 'sparkling', label: 'Sparkling wines (like Champagne or Prosecco)', value: 'sparkling' },
      { id: 'rose', label: 'Rosé wines', value: 'rose' },
      { id: 'sweet', label: 'Sweet wines (like Riesling or Port)', value: 'sweet' },
      { id: 'none', label: 'I haven\'t tried many wines yet', value: 'none' }
    ],
    required: false,
    educationalNote: 'Each wine type offers unique flavors and experiences - there\'s a whole world to explore!'
  },

  // Flavor Preferences - Sweetness
  {
    id: 'sweetness-preference',
    type: 'scale',
    category: 'preferences',
    question: 'Do you prefer dry or sweet wines?',
    description: 'Think about other drinks you enjoy - do you like sweet cocktails or prefer them dry?',
    scaleConfig: {
      min: 1,
      max: 10,
      minLabel: 'Very dry (no sweetness)',
      maxLabel: 'Very sweet',
      step: 1
    },
    required: true,
    educationalNote: 'Dry wines have little to no residual sugar, while sweet wines have noticeable sweetness. Most table wines are dry to off-dry.'
  },

  // Flavor Preferences - Body/Weight
  {
    id: 'body-preference',
    type: 'single-choice',
    category: 'preferences',
    question: 'When it comes to wine weight and richness, what appeals to you?',
    description: 'Think of it like milk - skim milk is light, whole milk is fuller.',
    options: [
      {
        id: 'light',
        label: 'Light and delicate',
        description: 'Refreshing, easy-drinking wines',
        value: 'light',
        educationalNote: 'Light wines are perfect for warm weather and pair well with lighter foods.'
      },
      {
        id: 'medium',
        label: 'Medium-bodied',
        description: 'Balanced between light and rich',
        value: 'medium',
        educationalNote: 'Medium-bodied wines are versatile and pair with a wide range of foods.'
      },
      {
        id: 'full',
        label: 'Rich and full-bodied',
        description: 'Bold, intense wines with lots of flavor',
        value: 'full',
        educationalNote: 'Full-bodied wines are great with hearty meals and for sipping slowly.'
      },
      {
        id: 'varies',
        label: 'I enjoy different styles',
        description: 'It depends on my mood and the occasion',
        value: 'varies'
      }
    ],
    required: true
  },

  // Food Pairing Importance
  {
    id: 'food-pairing-importance',
    type: 'scale',
    category: 'food-pairing',
    question: 'How important is it that wine pairs well with food?',
    description: 'Some people love wine with meals, others prefer it on its own.',
    scaleConfig: {
      min: 1,
      max: 10,
      minLabel: 'I mostly drink wine alone',
      maxLabel: 'Wine and food pairing is essential',
      step: 1
    },
    required: true,
    educationalNote: 'Great wine can be enjoyed both ways! Food pairing can enhance both the wine and the meal.'
  },

  // Occasion Preferences
  {
    id: 'occasion-preferences',
    type: 'multiple-choice',
    category: 'lifestyle',
    question: 'When do you most enjoy drinking wine?',
    description: 'Select all situations where you might enjoy wine.',
    options: [
      { id: 'dinner-home', label: 'Dinner at home', value: 'dinner-home' },
      { id: 'dinner-out', label: 'Dining out at restaurants', value: 'dinner-out' },
      { id: 'social', label: 'Social gatherings with friends', value: 'social' },
      { id: 'romantic', label: 'Romantic occasions', value: 'romantic' },
      { id: 'celebrations', label: 'Celebrations and special events', value: 'celebrations' },
      { id: 'relaxing', label: 'Relaxing after work', value: 'relaxing' },
      { id: 'cooking', label: 'While cooking', value: 'cooking' },
      { id: 'weekend', label: 'Weekend afternoons', value: 'weekend' }
    ],
    required: false
  },

  // Flavor Intensity Preference
  {
    id: 'flavor-intensity',
    type: 'single-choice',
    category: 'preferences',
    question: 'How do you feel about bold, intense flavors?',
    description: 'Think about your preferences in food - do you like subtle or bold flavors?',
    options: [
      {
        id: 'subtle',
        label: 'I prefer subtle, delicate flavors',
        value: 'subtle',
        educationalNote: 'Elegant wines with finesse can be incredibly complex and rewarding.'
      },
      {
        id: 'moderate',
        label: 'I like a good balance',
        value: 'moderate',
        educationalNote: 'Balanced wines offer the best of both worlds - complexity without overwhelming intensity.'
      },
      {
        id: 'bold',
        label: 'I love bold, intense flavors',
        value: 'bold',
        educationalNote: 'Bold wines can be incredibly expressive and pair wonderfully with rich foods.'
      }
    ],
    required: true
  },

  // Regional Interest
  {
    id: 'regional-interest',
    type: 'multiple-choice',
    category: 'preferences',
    question: 'Are there any wine regions that interest you?',
    description: 'Don\'t worry if you\'re not familiar with regions - we can help you explore!',
    options: [
      { id: 'france', label: 'France (Bordeaux, Burgundy, Champagne)', value: 'france' },
      { id: 'italy', label: 'Italy (Tuscany, Piedmont, Veneto)', value: 'italy' },
      { id: 'spain', label: 'Spain (Rioja, Ribera del Duero)', value: 'spain' },
      { id: 'california', label: 'California (Napa Valley, Sonoma)', value: 'california' },
      { id: 'oregon', label: 'Oregon (Willamette Valley)', value: 'oregon' },
      { id: 'washington', label: 'Washington State', value: 'washington' },
      { id: 'australia', label: 'Australia (Barossa Valley, Hunter Valley)', value: 'australia' },
      { id: 'newzealand', label: 'New Zealand (Marlborough, Central Otago)', value: 'newzealand' },
      { id: 'argentina', label: 'Argentina (Mendoza)', value: 'argentina' },
      { id: 'chile', label: 'Chile (Maipo Valley, Casablanca)', value: 'chile' },
      { id: 'explore', label: 'I\'d like to explore different regions', value: 'explore' },
      { id: 'no-preference', label: 'No preference - surprise me!', value: 'no-preference' }
    ],
    required: false,
    educationalNote: 'Each region has its own unique style and character - exploring different regions is one of the joys of wine!'
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