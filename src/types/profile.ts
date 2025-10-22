// Profile types for long-term palate modeling

export type Scale01 = number // 0.0 – 1.0

export type AromaFamily =
  | 'citrus'
  | 'stone_fruit'
  | 'tropical'
  | 'red_fruit'
  | 'black_fruit'
  | 'floral'
  | 'herbal_green'
  | 'pepper_spice'
  | 'earth_mineral'
  | 'oak_vanilla_smoke'
  | 'dairy_butter'
  | 'honey_oxidative'

export type OccasionCode =
  | 'everyday'
  | 'hot_day_patio'
  | 'cozy_winter'
  | 'spicy_food_night'
  | 'steak_night'
  | 'seafood_sushi'
  | 'pizza_pasta'
  | 'celebration_toast'
  | 'dessert_night'
  | 'aperitif'

export interface StablePalate {
  sweetness: Scale01
  acidity: Scale01
  tannin: Scale01
  bitterness: Scale01
  body: Scale01
  alcoholWarmth: Scale01
  sparkleIntensity: Scale01
}

export interface StyleLevers {
  oak: Scale01
  malolacticButter: Scale01
  oxidative: Scale01
  minerality: Scale01
  fruitRipeness: Scale01
}

export interface AromaAffinity {
  family: AromaFamily
  affinity: number // -1.0 .. 1.0
}

export interface ContextWeightsEntry {
  occasion: OccasionCode
  weights: Partial<Record<keyof (StablePalate & StyleLevers), Scale01>>
}

export interface FoodProfile {
  heatLevel: 0 | 1 | 2 | 3 | 4 | 5
  salt: Scale01
  fat: Scale01
  sauceSweetness: Scale01
  sauceAcidity: Scale01
  cuisines: string[]
  proteins: string[]
}

export type BudgetTier = 'weeknight' | 'weekend' | 'celebration'
export type WineKnowledge = 'novice' | 'intermediate' | 'expert'

export interface FlavorMapCategory {
  // Selected axes relevant for category
  tannin?: Scale01
  acidity?: Scale01
  body?: Scale01
  oak?: Scale01
  fruitRipeness?: Scale01
  aromaAffinitiesTop?: AromaFamily[]
  dryness?: string // e.g., Brut
  bubbleIntensity?: Scale01
}

export interface FlavorMaps {
  red?: FlavorMapCategory
  white?: FlavorMapCategory
  sparkling?: FlavorMapCategory
}

export interface UserProfile {
  userId: string
  stablePalate: StablePalate
  aromaAffinities: AromaAffinity[]
  styleLevers: StyleLevers
  contextWeights: ContextWeightsEntry[]
  foodProfile?: FoodProfile
  preferences: {
    novelty: Scale01
    budgetTier: BudgetTier
    values?: string[]
  }
  dislikes: string[]
  sparkling: { drynessBand?: string; bubbleIntensity?: Scale01 }
  wineKnowledge: WineKnowledge
  flavorMaps: FlavorMaps
}


