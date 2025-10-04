// AI Recommendation Engine Types

import { Wine, TasteProfile, RecommendationContext } from '@/types'

// ============================================================================
// AI Service Configuration
// ============================================================================

export interface AIConfig {
  openai: {
    apiKey: string
    model: string
    temperature: number
    maxTokens: number
  }
  vectorDb: {
    apiKey?: string
    environment?: string
    indexName: string
  }
  responseValidation: {
    noEmojis: boolean
    professionalTone: boolean
    maxResponseLength: number
  }
}

// ============================================================================
// AI Prompt Templates
// ============================================================================

export interface PromptTemplate {
  systemPrompt: string
  userExperienceLevel: 'beginner' | 'intermediate' | 'advanced'
  responseGuidelines: ResponseGuidelines
}

export interface ResponseGuidelines {
  noEmojis: true
  tone: 'professional_sommelier'
  includeEducation: boolean
  vocabularyLevel: 'accessible' | 'intermediate' | 'advanced'
  maxLength: number
}

// ============================================================================
// AI Request/Response Types
// ============================================================================

export interface AIRecommendationRequest {
  userId: string
  query: string
  context: RecommendationContext
  userProfile: TasteProfile
  inventory?: Wine[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export interface AIRecommendationResponse {
  recommendations: AIRecommendation[]
  reasoning: string
  confidence: number
  educationalNotes?: string
  followUpQuestions?: string[]
  responseMetadata: ResponseMetadata
}

export interface AIRecommendation {
  type: 'inventory' | 'purchase' | 'pairing'
  wineId?: string
  suggestedWine?: SuggestedWine
  reasoning: string
  confidence: number
  educationalContext?: string
  pairingNotes?: string
  servingRecommendations?: ServingRecommendations
}

export interface SuggestedWine {
  name: string
  producer: string
  vintage?: number
  region: string
  country: string
  varietal: string[]
  type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified'
  estimatedPrice?: {
    min: number
    max: number
    currency: string
  }
  availabilityInfo?: string
  externalId?: string
  tastingNotes?: string
  professionalRatings?: Array<{
    source: string
    score: number
    maxScore: number
  }>
}

export interface ServingRecommendations {
  temperature?: {
    celsius: number
    fahrenheit: number
  }
  decantingTime?: number
  glassType?: string
  servingSize?: string
}

export interface ResponseMetadata {
  model: string
  tokensUsed: number
  responseTime: number
  validationPassed: boolean
  validationErrors?: string[]
  confidence: number
}

// ============================================================================
// Vector Database Types
// ============================================================================

export interface WineVector {
  id: string
  wineId: string
  embedding: number[]
  metadata: WineVectorMetadata
}

export interface WineVectorMetadata {
  name: string
  producer: string
  region: string
  country: string
  varietal: string[]
  type: string
  vintage: number
  tastingNotes?: string
  characteristics: string[]
  priceRange?: string
  professionalRatings?: number
}

export interface VectorSearchResult {
  id: string
  score: number
  metadata: WineVectorMetadata
}

// ============================================================================
// Context Analysis Types
// ============================================================================

export interface ContextAnalysis {
  occasion: OccasionContext
  foodPairing: FoodPairingContext
  preferences: PreferenceContext
  constraints: ConstraintContext
  urgency: UrgencyContext
}

export interface OccasionContext {
  type: string
  formality: 'casual' | 'semi_formal' | 'formal'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night'
  season: 'spring' | 'summer' | 'fall' | 'winter'
  companionCount: number
  specialConsiderations?: string[]
}

export interface FoodPairingContext {
  mainDish?: string
  cuisine?: string
  flavors: string[]
  cookingMethod?: string
  richness: 'light' | 'medium' | 'rich'
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot'
}

export interface PreferenceContext {
  tasteProfile: TasteProfile
  recentConsumption: Wine[]
  dislikedWines: string[]
  preferredProducers: string[]
  adventurousness: number // 1-10 scale
}

export interface ConstraintContext {
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  availability: 'inventory_only' | 'purchase_allowed' | 'restaurant_list'
  timeConstraints?: string
  dietaryRestrictions?: string[]
}

export interface UrgencyContext {
  level: 'low' | 'medium' | 'high'
  drinkingWindowPriority: boolean
  immediateNeed: boolean
  planningAhead: boolean
}

// ============================================================================
// AI Response Validation Types
// ============================================================================

export interface ValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number
}

export interface ValidationError {
  type: 'emoji_detected' | 'inappropriate_tone' | 'factual_error' | 'length_exceeded'
  message: string
  severity: 'low' | 'medium' | 'high'
  location?: string
}

export interface ValidationWarning {
  type: 'complexity_mismatch' | 'confidence_low' | 'incomplete_reasoning'
  message: string
  suggestion?: string
}

// ============================================================================
// Monitoring and Analytics Types
// ============================================================================

export interface AIMetrics {
  requestId: string
  userId: string
  timestamp: Date
  model: string
  tokensUsed: number
  responseTime: number
  cost: number
  confidence: number
  userFeedback?: 'positive' | 'negative' | 'neutral'
  validationScore: number
}

export interface PerformanceMetrics {
  averageResponseTime: number
  totalRequests: number
  successRate: number
  averageConfidence: number
  costPerRequest: number
  userSatisfactionScore: number
}

// ============================================================================
// RAG (Retrieval-Augmented Generation) Types
// ============================================================================

export interface RAGContext {
  wineKnowledge: WineKnowledgeItem[]
  userHistory: UserInteractionHistory
  similarUsers: SimilarUserProfile[]
  expertOpinions: ExpertOpinion[]
}

export interface WineKnowledgeItem {
  id: string
  type: 'wine_data' | 'pairing_rule' | 'regional_info' | 'varietal_info'
  content: string
  source: string
  confidence: number
  lastUpdated: Date
}

export interface UserInteractionHistory {
  recentQueries: string[]
  preferenceEvolution: TasteProfileChange[]
  feedbackHistory: FeedbackRecord[]
}

export interface TasteProfileChange {
  timestamp: Date
  changes: Record<string, any>
  trigger: 'consumption' | 'feedback' | 'quiz_retake'
}

export interface FeedbackRecord {
  recommendationId: string
  feedback: 'accepted' | 'rejected' | 'modified'
  reason?: string
  timestamp: Date
}

export interface SimilarUserProfile {
  userId: string
  similarity: number
  sharedPreferences: string[]
  successfulRecommendations: string[]
}

export interface ExpertOpinion {
  source: string
  expert: string
  opinion: string
  wineId?: string
  region?: string
  varietal?: string
  confidence: number
  date: Date
}