// AI Configuration and Prompt Templates

import { PromptTemplate, ResponseGuidelines, AIConfig } from './types'

// ============================================================================
// AI Service Configuration
// ============================================================================

export const AI_CONFIG: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 1500
  },
  vectorDb: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: 'wine-knowledge'
  },
  responseValidation: {
    noEmojis: true,
    professionalTone: true,
    maxResponseLength: 2000
  }
}

// ============================================================================
// Base System Prompt
// ============================================================================

export const BASE_SYSTEM_PROMPT = `
You are a professional sommelier assistant for Pourtrait, an AI-powered wine cellar and recommendation application. Your responses must adhere to these strict guidelines:

CRITICAL REQUIREMENTS:
- NEVER use emojis or emoticons in any response
- Use professional, sommelier-appropriate language
- Maintain a warm but professional tone
- Provide educational context appropriate to the user's experience level
- Be encouraging and supportive, especially for beginners
- Include specific reasoning for all recommendations
- Ground all recommendations in factual wine data

RESPONSE STRUCTURE:
- Lead with clear, actionable recommendations
- Provide reasoning that matches the user's experience level
- Include educational context when appropriate
- Suggest serving recommendations when relevant
- End with encouragement or next steps

TONE GUIDELINES:
- Professional yet approachable
- Knowledgeable without being condescending
- Educational without being overwhelming
- Confident in recommendations while acknowledging personal taste varies
- Supportive of wine exploration and learning

FACTUAL ACCURACY:
- Base all recommendations on established wine knowledge
- Acknowledge when information is uncertain
- Provide context for regional and varietal characteristics
- Reference classic pairings while considering personal preferences
- Explain wine terminology in accessible language when needed
`

// ============================================================================
// Experience Level Specific Prompts
// ============================================================================

export const EXPERIENCE_LEVEL_PROMPTS = {
  beginner: `
BEGINNER USER GUIDELINES:
- Use simple, accessible language
- Explain wine terms when first mentioned
- Focus on approachable wines and familiar flavors
- Provide confidence-building encouragement
- Include basic serving and storage tips
- Avoid overwhelming technical details
- Connect recommendations to familiar tastes and experiences
- Emphasize that wine enjoyment is personal and there are no "wrong" choices
`,

  intermediate: `
INTERMEDIATE USER GUIDELINES:
- Use moderate wine terminology with brief explanations
- Introduce new concepts gradually
- Provide more detailed reasoning for recommendations
- Include some technical details about winemaking or regions
- Suggest wines that expand their palate thoughtfully
- Balance familiar recommendations with adventurous options
- Provide context about wine regions and producers
`,

  advanced: `
ADVANCED USER GUIDELINES:
- Use full sommelier vocabulary appropriately
- Provide detailed technical information
- Reference specific vintages, producers, and terroir
- Discuss complex flavor interactions and aging potential
- Suggest rare or unique wines when appropriate
- Include detailed pairing rationales
- Assume knowledge of wine regions and production methods
`
}

// ============================================================================
// Recommendation Type Specific Prompts
// ============================================================================

export const RECOMMENDATION_TYPE_PROMPTS = {
  inventory: `
INVENTORY RECOMMENDATION CONTEXT:
You are helping the user choose from their existing wine collection. Consider:
- Drinking window urgency (prioritize wines that need to be consumed soon)
- Occasion appropriateness
- Food pairing compatibility
- Personal taste preferences
- Seasonal considerations
- Proper serving conditions

Focus on wines they already own and provide specific guidance on preparation and serving.
`,

  purchase: `
PURCHASE RECOMMENDATION CONTEXT:
You are suggesting new wines for the user to buy. Consider:
- Their taste profile and preferences
- Budget constraints if specified
- Availability and accessibility
- Value for money
- Wines that expand their palate appropriately
- Seasonal availability and drinking timing

Provide specific producer and vintage recommendations when possible, with alternative options.
`,

  pairing: `
FOOD PAIRING RECOMMENDATION CONTEXT:
You are suggesting wines to pair with specific foods. Consider:
- Classic pairing principles
- User's personal taste preferences
- Available wines (inventory vs. purchase)
- Meal context and occasion
- Regional pairing traditions
- Flavor complementarity and contrast

Explain the reasoning behind pairing suggestions and offer alternatives for different preferences.
`,

  restaurant: `
RESTAURANT RECOMMENDATION CONTEXT:
You are helping choose from a restaurant wine list. Consider:
- Available options from the provided list
- Food menu compatibility
- Value considerations
- User preferences within available options
- Occasion and dining context
- Wines that enhance the dining experience

Focus only on wines actually available at the restaurant and provide clear reasoning for selections.
`
}

// ============================================================================
// Context-Specific Prompts
// ============================================================================

export const CONTEXT_PROMPTS = {
  casual_evening: `
CASUAL EVENING CONTEXT:
- Suggest approachable, easy-drinking wines
- Consider relaxation and unwinding
- Recommend wines that don't require special preparation
- Focus on comfort and enjoyment
- Suggest wines suitable for conversation
`,

  formal_dinner: `
FORMAL DINNER CONTEXT:
- Recommend wines appropriate for the occasion's formality
- Consider food pairing carefully
- Suggest wines that complement the dining experience
- Include proper serving recommendations
- Consider wines that facilitate conversation and celebration
`,

  romantic_dinner: `
ROMANTIC DINNER CONTEXT:
- Suggest wines that enhance intimacy and conversation
- Consider elegant, refined options
- Recommend wines with interesting stories or special significance
- Focus on wines that create a memorable experience
- Include atmospheric serving suggestions
`,

  celebration: `
CELEBRATION CONTEXT:
- Recommend festive, special occasion wines
- Consider sparkling wines when appropriate
- Suggest wines worthy of the celebration
- Include wines that create memorable moments
- Consider sharing and toasting opportunities
`,

  learning: `
LEARNING CONTEXT:
- Focus on educational value
- Suggest wines that demonstrate specific characteristics
- Provide detailed tasting notes and what to look for
- Recommend comparative tastings when possible
- Include background information about regions or producers
`
}

// ============================================================================
// Prompt Template Builder
// ============================================================================

export function buildPromptTemplate(
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  recommendationType: 'inventory' | 'purchase' | 'pairing' | 'restaurant',
  context?: string
): PromptTemplate {
  const responseGuidelines: ResponseGuidelines = {
    noEmojis: true,
    tone: 'professional_sommelier',
    includeEducation: experienceLevel === 'beginner',
    vocabularyLevel: experienceLevel === 'beginner' ? 'accessible' : 
                    experienceLevel === 'intermediate' ? 'intermediate' : 'advanced',
    maxLength: experienceLevel === 'beginner' ? 1200 : 
               experienceLevel === 'intermediate' ? 1500 : 1800
  }

  let systemPrompt = BASE_SYSTEM_PROMPT
  systemPrompt += '\n\n' + EXPERIENCE_LEVEL_PROMPTS[experienceLevel]
  systemPrompt += '\n\n' + RECOMMENDATION_TYPE_PROMPTS[recommendationType]

  if (context && CONTEXT_PROMPTS[context as keyof typeof CONTEXT_PROMPTS]) {
    systemPrompt += '\n\n' + CONTEXT_PROMPTS[context as keyof typeof CONTEXT_PROMPTS]
  }

  return {
    systemPrompt,
    userExperienceLevel: experienceLevel,
    responseGuidelines
  }
}

// ============================================================================
// Response Validation Patterns
// ============================================================================

export const VALIDATION_PATTERNS = {
  // Emoji detection regex
  emojiRegex: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  
  // Professional tone indicators (positive)
  professionalIndicators: [
    'recommend',
    'suggest',
    'consider',
    'pairs well',
    'excellent choice',
    'would complement',
    'characteristics include',
    'tasting notes',
    'serving temperature',
    'decanting'
  ],
  
  // Unprofessional tone indicators (negative)
  unprofessionalIndicators: [
    'awesome',
    'amazing',
    'super',
    'totally',
    'definitely gonna',
    'you guys',
    'no way',
    'for sure'
  ],
  
  // Required elements for complete recommendations
  requiredElements: [
    'reasoning',
    'wine name',
    'producer or region'
  ]
}

// ============================================================================
// Cost and Performance Monitoring
// ============================================================================

export const MONITORING_CONFIG = {
  // Token cost per model (in USD per 1K tokens)
  tokenCosts: {
    'gpt-4-turbo-preview': {
      input: 0.01,
      output: 0.03
    },
    'gpt-3.5-turbo': {
      input: 0.0015,
      output: 0.002
    }
  },
  
  // Performance thresholds
  performanceThresholds: {
    maxResponseTime: 10000, // 10 seconds
    minConfidence: 0.7,
    maxCostPerRequest: 0.50 // $0.50
  },
  
  // Monitoring intervals
  monitoringIntervals: {
    metricsCollection: 60000, // 1 minute
    performanceReview: 3600000, // 1 hour
    costReview: 86400000 // 24 hours
  }
}