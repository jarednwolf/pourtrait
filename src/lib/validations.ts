import { z } from 'zod'

// ============================================================================
// Base Validation Schemas
// ============================================================================

const dateSchema = z.union([z.date(), z.string().datetime()])

const priceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().length(3).default('USD')
}).refine(data => data.max >= data.min, {
  message: "Maximum price must be greater than or equal to minimum price"
})

// ============================================================================
// User Validation Schemas
// ============================================================================

export const userPreferencesSchema = z.object({
  language: z.string().min(2).max(5).default('en'),
  notifications: z.object({
    drinkingWindowAlerts: z.boolean().default(true),
    recommendations: z.boolean().default(true),
    email: z.boolean().default(true),
    push: z.boolean().default(false)
  }),
  privacy: z.object({
    shareData: z.boolean().default(false),
    analytics: z.boolean().default(true)
  })
})

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferences: userPreferencesSchema.partial().optional()
})

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  onboardingCompleted: z.boolean().default(false),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferences: userPreferencesSchema
})

// ============================================================================
// Wine Validation Schemas
// ============================================================================

export const drinkingWindowSchema = z.object({
  earliestDate: z.union([z.date(), z.string().date()]),
  peakStartDate: z.union([z.date(), z.string().date()]),
  peakEndDate: z.union([z.date(), z.string().date()]),
  latestDate: z.union([z.date(), z.string().date()]),
  currentStatus: z.enum(['too_young', 'ready', 'peak', 'declining', 'over_hill'])
}).refine(data => {
  const earliest = new Date(data.earliestDate)
  const peakStart = new Date(data.peakStartDate)
  const peakEnd = new Date(data.peakEndDate)
  const latest = new Date(data.latestDate)
  
  return earliest <= peakStart && peakStart <= peakEnd && peakEnd <= latest
}, {
  message: "Drinking window dates must be in chronological order"
})

export const professionalRatingSchema = z.object({
  source: z.string().min(1, 'Rating source is required'),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  reviewer: z.string().optional(),
  reviewDate: dateSchema.optional()
}).refine(data => data.score <= data.maxScore, {
  message: "Score cannot exceed maximum score"
})

export const externalWineDataSchema = z.object({
  wineDbId: z.string().optional(),
  professionalRatings: z.array(professionalRatingSchema).optional(),
  tastingNotes: z.string().max(1000).optional(),
  alcoholContent: z.number().min(0).max(50).optional(),
  servingTemperature: z.object({
    min: z.number().min(-10).max(30),
    max: z.number().min(-10).max(30)
  }).refine(data => data.max >= data.min, {
    message: "Maximum temperature must be greater than or equal to minimum"
  }).optional(),
  decantingTime: z.number().min(0).max(480).optional(), // Max 8 hours
  agingPotential: z.number().min(0).max(100).optional(), // Years
  lastUpdated: dateSchema.optional()
})

export const wineInputSchema = z.object({
  name: z.string().min(1, 'Wine name is required').max(200, 'Wine name too long'),
  producer: z.string().min(1, 'Producer is required').max(200, 'Producer name too long'),
  vintage: z.number()
    .int('Vintage must be a whole number')
    .min(1800, 'Vintage too old')
    .max(new Date().getFullYear() + 5, 'Vintage cannot be more than 5 years in the future'),
  region: z.string().min(1, 'Region is required').max(100, 'Region name too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
  varietal: z.array(z.string().min(1).max(50)).min(1, 'At least one varietal is required'),
  type: z.enum(['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified']),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  purchasePrice: z.number().min(0, 'Price cannot be negative').optional(),
  purchaseDate: dateSchema.optional(),
  personalRating: z.number().min(1).max(10).optional(),
  personalNotes: z.string().max(1000, 'Notes too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional()
})

export const wineSchema = wineInputSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  drinkingWindow: drinkingWindowSchema,
  externalData: externalWineDataSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema
})

// ============================================================================
// Taste Profile Validation Schemas
// ============================================================================

export const flavorProfileSchema = z.object({
  fruitiness: z.number().min(1).max(10),
  earthiness: z.number().min(1).max(10),
  oakiness: z.number().min(1).max(10),
  acidity: z.number().min(1).max(10),
  tannins: z.number().min(1).max(10),
  sweetness: z.number().min(1).max(10),
  body: z.enum(['light', 'medium', 'full']),
  preferredRegions: z.array(z.string().min(1).max(100)),
  preferredVarietals: z.array(z.string().min(1).max(50)),
  dislikedCharacteristics: z.array(z.string().min(1).max(100))
})

export const generalPreferencesSchema = z.object({
  priceRange: priceRangeSchema,
  occasionPreferences: z.array(z.string().min(1).max(50)),
  foodPairingImportance: z.number().min(1).max(10)
})

export const tastingRecordSchema = z.object({
  wineId: z.string().uuid(),
  rating: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
  characteristics: z.array(z.string().min(1).max(50)),
  tastedAt: dateSchema
})

export const tasteProfileSchema = z.object({
  userId: z.string().uuid(),
  redWinePreferences: flavorProfileSchema,
  whiteWinePreferences: flavorProfileSchema,
  sparklingPreferences: flavorProfileSchema,
  generalPreferences: generalPreferencesSchema,
  learningHistory: z.array(tastingRecordSchema),
  confidenceScore: z.number().min(0).max(1),
  lastUpdated: dateSchema
})

export const tastePreferencesSchema = z.object({
  redWinePreferences: flavorProfileSchema.partial().optional(),
  whiteWinePreferences: flavorProfileSchema.partial().optional(),
  sparklingPreferences: flavorProfileSchema.partial().optional(),
  generalPreferences: generalPreferencesSchema.partial().optional()
})

// ============================================================================
// Recommendation Validation Schemas
// ============================================================================

export const wineSuggestionSchema = z.object({
  name: z.string().min(1).max(200),
  producer: z.string().min(1).max(200),
  vintage: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  region: z.string().min(1).max(100),
  varietal: z.array(z.string().min(1).max(50)).min(1),
  type: z.enum(['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified']),
  estimatedPrice: priceRangeSchema.optional(),
  availabilityInfo: z.string().max(200).optional(),
  externalId: z.string().optional()
})

export const recommendationContextSchema = z.object({
  occasion: z.string().max(100).optional(),
  foodPairing: z.string().max(200).optional(),
  priceRange: priceRangeSchema.optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  companions: z.array(z.string().min(1).max(100)).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'late_night']).optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional()
})

export const recommendationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['inventory', 'purchase', 'pairing']),
  wineId: z.string().uuid().optional(),
  suggestedWine: wineSuggestionSchema.optional(),
  context: recommendationContextSchema,
  reasoning: z.string().min(1, 'Reasoning is required').max(1000, 'Reasoning too long'),
  confidence: z.number().min(0).max(1),
  createdAt: dateSchema,
  userFeedback: z.enum(['accepted', 'rejected', 'modified']).optional()
}).refine(data => {
  // Either wineId (for inventory recommendations) or suggestedWine (for purchase recommendations) must be provided
  return (data.type === 'inventory' && data.wineId) || 
         (data.type !== 'inventory' && data.suggestedWine)
}, {
  message: "Inventory recommendations must have wineId, purchase/pairing recommendations must have suggestedWine"
})

// ============================================================================
// Consumption Tracking Validation Schemas
// ============================================================================

export const consumptionRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  wineId: z.string().uuid(),
  consumedAt: dateSchema,
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  occasion: z.string().max(100).optional(),
  companions: z.array(z.string().min(1).max(100)).optional(),
  foodPairing: z.string().max(200).optional(),
  createdAt: dateSchema
})

// ============================================================================
// Drinking Partner Validation Schemas
// ============================================================================

export const drinkingPartnerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  tasteProfile: tasteProfileSchema.partial().optional(),
  notes: z.string().max(500).optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema
})

// ============================================================================
// Image Processing Validation Schemas
// ============================================================================

export const wineRecognitionResultSchema = z.object({
  success: z.boolean(),
  confidence: z.number().min(0).max(1),
  extractedData: z.object({
    name: z.string().optional(),
    producer: z.string().optional(),
    vintage: z.number().int().optional(),
    region: z.string().optional(),
    varietal: z.array(z.string()).optional()
  }).optional(),
  rawText: z.string().optional(),
  error: z.string().optional()
})

export const ocrResultSchema = z.object({
  success: z.boolean(),
  extractedText: z.string(),
  confidence: z.number().min(0).max(1),
  error: z.string().optional()
})

// ============================================================================
// Filter Validation Schemas
// ============================================================================

export const inventoryFiltersSchema = z.object({
  type: z.array(z.enum(['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified'])).optional(),
  region: z.array(z.string().min(1)).optional(),
  vintage: z.object({
    min: z.number().int().min(1800),
    max: z.number().int().max(new Date().getFullYear() + 5)
  }).refine(data => data.max >= data.min, {
    message: "Maximum vintage must be greater than or equal to minimum"
  }).optional(),
  priceRange: priceRangeSchema.optional(),
  drinkingWindowStatus: z.array(z.enum(['too_young', 'ready', 'peak', 'declining', 'over_hill'])).optional(),
  rating: z.object({
    min: z.number().min(1).max(10),
    max: z.number().min(1).max(10)
  }).refine(data => data.max >= data.min, {
    message: "Maximum rating must be greater than or equal to minimum"
  }).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['name', 'producer', 'vintage', 'rating', 'purchaseDate', 'drinkingWindow']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// ============================================================================
// API Response Validation Schemas
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
  code: z.number().optional()
})

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  success: z.boolean(),
  data: z.array(itemSchema).optional(),
  error: z.string().optional(),
  code: z.number().optional(),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0)
  })
})

// ============================================================================
// Utility Functions for Validation
// ============================================================================

export const validateWineInput = (data: unknown) => {
  return wineInputSchema.safeParse(data)
}

export const validateUserRegistration = (data: unknown) => {
  return userRegistrationSchema.safeParse(data)
}

export const validateTastePreferences = (data: unknown) => {
  return tastePreferencesSchema.safeParse(data)
}

export const validateInventoryFilters = (data: unknown) => {
  return inventoryFiltersSchema.safeParse(data)
}

export const validateRecommendationContext = (data: unknown) => {
  return recommendationContextSchema.safeParse(data)
}

// Type inference helpers
export type WineInputType = z.infer<typeof wineInputSchema>
export type UserRegistrationType = z.infer<typeof userRegistrationSchema>
export type TastePreferencesType = z.infer<typeof tastePreferencesSchema>
export type InventoryFiltersType = z.infer<typeof inventoryFiltersSchema>
export type RecommendationContextType = z.infer<typeof recommendationContextSchema>