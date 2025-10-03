// Core application types

// ============================================================================
// User Management Types
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
  onboardingCompleted: boolean
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  preferences: UserPreferences
}

export interface UserPreferences {
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  drinkingWindowAlerts: boolean
  recommendations: boolean
  email: boolean
  push: boolean
}

export interface PrivacySettings {
  shareData: boolean
  analytics: boolean
}

// ============================================================================
// Wine Management Types
// ============================================================================

export interface Wine {
  id: string
  userId: string
  name: string
  producer: string
  vintage: number
  region: string
  country: string
  varietal: string[]
  type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified'
  quantity: number
  purchasePrice?: number
  purchaseDate?: Date
  drinkingWindow: DrinkingWindow
  personalRating?: number
  personalNotes?: string
  imageUrl?: string
  externalData: ExternalWineData
  createdAt: Date
  updatedAt: Date
}

export interface DrinkingWindow {
  earliestDate: Date
  peakStartDate: Date
  peakEndDate: Date
  latestDate: Date
  currentStatus: 'too_young' | 'ready' | 'peak' | 'declining' | 'over_hill'
}

export interface ExternalWineData {
  wineDbId?: string
  professionalRatings?: ProfessionalRating[]
  tastingNotes?: string
  alcoholContent?: number
  servingTemperature?: {
    min: number
    max: number
  }
  decantingTime?: number
  agingPotential?: number
  lastUpdated?: Date
}

export interface ProfessionalRating {
  source: string
  score: number
  maxScore: number
  reviewer?: string
  reviewDate?: Date
}

// ============================================================================
// Taste Profile Types
// ============================================================================

export interface TasteProfile {
  userId: string
  redWinePreferences: FlavorProfile
  whiteWinePreferences: FlavorProfile
  sparklingPreferences: FlavorProfile
  generalPreferences: GeneralPreferences
  learningHistory: TastingRecord[]
  confidenceScore: number
  lastUpdated: Date
}

export interface FlavorProfile {
  fruitiness: number // 1-10 scale
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

export interface GeneralPreferences {
  priceRange: {
    min: number
    max: number
    currency: string
  }
  occasionPreferences: string[]
  foodPairingImportance: number // 1-10 scale
}

export interface TastingRecord {
  wineId: string
  rating: number
  notes?: string
  characteristics: string[]
  tastedAt: Date
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface Recommendation {
  id: string
  userId: string
  type: 'inventory' | 'purchase' | 'pairing'
  wineId?: string // For inventory recommendations
  suggestedWine?: WineSuggestion // For purchase recommendations
  context: RecommendationContext
  reasoning: string
  confidence: number
  createdAt: Date
  userFeedback?: 'accepted' | 'rejected' | 'modified'
}

export interface WineSuggestion {
  name: string
  producer: string
  vintage?: number
  region: string
  varietal: string[]
  type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified'
  estimatedPrice?: PriceRange
  availabilityInfo?: string
  externalId?: string
}

export interface RecommendationContext {
  occasion?: string
  foodPairing?: string
  priceRange?: PriceRange
  urgency?: 'low' | 'medium' | 'high'
  companions?: string[]
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'late_night'
  season?: 'spring' | 'summer' | 'fall' | 'winter'
}

export interface PriceRange {
  min: number
  max: number
  currency: string
}

// ============================================================================
// Consumption Tracking Types
// ============================================================================

export interface ConsumptionRecord {
  id: string
  userId: string
  wineId: string
  consumedAt: Date
  rating?: number
  notes?: string
  occasion?: string
  companions?: string[]
  foodPairing?: string
  createdAt: Date
}

// ============================================================================
// Drinking Partner Types
// ============================================================================

export interface DrinkingPartner {
  id: string
  userId: string
  name: string
  tasteProfile?: Partial<TasteProfile>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Image Processing Types
// ============================================================================

export interface WineRecognitionResult {
  success: boolean
  confidence: number
  extractedData?: {
    name?: string
    producer?: string
    vintage?: number
    region?: string
    varietal?: string[]
    type?: Wine['type']
  }
  rawText?: string
  error?: string
}

export interface OCRResult {
  success: boolean
  extractedText: string
  confidence: number
  boundingBoxes?: Array<{
    text: string
    confidence: number
    vertices: Array<{ x: number; y: number }>
  }>
  error?: string
}

export interface WineListExtraction {
  success: boolean
  wines: ExtractedWineListItem[]
  rawText: string
  error?: string
}

export interface ExtractedWineListItem {
  name: string
  producer?: string
  vintage?: number
  price?: string
  description?: string
  confidence: number
}

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface CameraCapture {
  file: File
  preview: string
  timestamp: Date
}

export interface ImageUploadResult {
  success: boolean
  url?: string
  optimizedUrl?: string
  error?: string
}

// ============================================================================
// Database Input Types (for creation/updates)
// ============================================================================

export interface WineInput {
  name: string
  producer: string
  vintage: number
  region: string
  country: string
  varietal: string[]
  type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified'
  quantity: number
  purchasePrice?: number
  purchaseDate?: Date
  personalRating?: number
  personalNotes?: string
  imageUrl?: string
}

export interface UserRegistration {
  email: string
  name: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  preferences?: Partial<UserPreferences>
}

export interface TastePreferences {
  redWinePreferences?: Partial<FlavorProfile>
  whiteWinePreferences?: Partial<FlavorProfile>
  sparklingPreferences?: Partial<FlavorProfile>
  generalPreferences?: Partial<GeneralPreferences>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface InventoryFilters {
  type?: Wine['type'][]
  region?: string[]
  vintage?: {
    min: number
    max: number
  }
  priceRange?: PriceRange
  drinkingWindowStatus?: DrinkingWindow['currentStatus'][]
  rating?: {
    min: number
    max: number
  }
  search?: string
  sortBy?: 'name' | 'producer' | 'vintage' | 'rating' | 'purchaseDate' | 'drinkingWindow'
  sortOrder?: 'asc' | 'desc'
}

// Re-export search types
export * from './search'

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationPreferences {
  drinkingWindowAlerts: boolean
  newRecommendations: boolean
  weeklyDigest: boolean
  email: boolean
  push: boolean
}

export interface Notification {
  id: string
  userId: string
  type: 'drinking_window' | 'recommendation' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: Date
}

// ============================================================================
// Data Export Types
// ============================================================================

export interface UserDataExport {
  user: Partial<User>
  wines: Wine[]
  tasteProfile?: TasteProfile
  consumptionHistory?: ConsumptionRecord[]
  exportDate: string
  version: string
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeImages?: boolean
  includePersonalNotes?: boolean
  includeConsumptionHistory?: boolean
  includeTasteProfile?: boolean
}

export interface ExportStats {
  totalWines: number
  totalConsumptionRecords: number
  hasTasteProfile: boolean
  accountCreated: string
  lastActivity: string
}

// ============================================================================
// Collection Sharing Types
// ============================================================================

export interface SharedCollection {
  id: string
  userId: string
  title: string
  description?: string
  wines: Wine[]
  isPublic: boolean
  shareToken: string
  createdAt: Date
  updatedAt: Date
  viewCount: number
}

export interface ShareOptions {
  title: string
  description?: string
  includePersonalNotes?: boolean
  includeRatings?: boolean
  wineIds?: string[]
}