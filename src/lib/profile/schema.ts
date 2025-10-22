import { z } from 'zod'

export const Scale01 = z.number().min(0).max(1)

export const AromaFamily = z.enum([
  'citrus','stone_fruit','tropical','red_fruit','black_fruit',
  'floral','herbal_green','pepper_spice','earth_mineral',
  'oak_vanilla_smoke','dairy_butter','honey_oxidative'
])

export const OccasionCode = z.enum([
  'everyday','hot_day_patio','cozy_winter','spicy_food_night','steak_night','seafood_sushi','pizza_pasta','celebration_toast','dessert_night','aperitif'
])

export const StablePalate = z.object({
  sweetness: Scale01,
  acidity: Scale01,
  tannin: Scale01,
  bitterness: Scale01,
  body: Scale01,
  alcoholWarmth: Scale01,
  sparkleIntensity: Scale01
})

export const StyleLevers = z.object({
  oak: Scale01,
  malolacticButter: Scale01,
  oxidative: Scale01,
  minerality: Scale01,
  fruitRipeness: Scale01
})

export const AromaAffinity = z.object({
  family: AromaFamily,
  affinity: z.number().min(-1).max(1)
})

export const ContextWeightsEntry = z.object({
  occasion: OccasionCode,
  weights: z.record(z.string(), Scale01).optional().default({})
})

export const FoodProfile = z.object({
  heatLevel: z.number().int().min(0).max(5),
  salt: Scale01,
  fat: Scale01,
  sauceSweetness: Scale01,
  sauceAcidity: Scale01,
  cuisines: z.array(z.string()),
  proteins: z.array(z.string())
})

export const FlavorMapCategory = z.object({
  tannin: Scale01.optional(),
  acidity: Scale01.optional(),
  body: Scale01.optional(),
  oak: Scale01.optional(),
  fruitRipeness: Scale01.optional(),
  aromaAffinitiesTop: z.array(AromaFamily).optional(),
  dryness: z.string().optional(),
  bubbleIntensity: Scale01.optional()
})

export const FlavorMaps = z.object({
  red: FlavorMapCategory.optional(),
  white: FlavorMapCategory.optional(),
  sparkling: FlavorMapCategory.optional()
})

export const UserProfileSchema = z.object({
  userId: z.string(),
  stablePalate: StablePalate,
  aromaAffinities: z.array(AromaAffinity),
  styleLevers: StyleLevers,
  contextWeights: z.array(ContextWeightsEntry),
  foodProfile: FoodProfile.optional(),
  preferences: z.object({
    novelty: Scale01,
    budgetTier: z.enum(['weeknight','weekend','celebration']),
    values: z.array(z.string()).optional()
  }),
  dislikes: z.array(z.string()),
  sparkling: z.object({
    drynessBand: z.string().optional(),
    bubbleIntensity: Scale01.optional()
  }),
  wineKnowledge: z.enum(['novice','intermediate','expert']),
  flavorMaps: FlavorMaps
})

export type UserProfileInput = z.infer<typeof UserProfileSchema>


