import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

type Experience = 'novice' | 'intermediate' | 'expert'

interface BuildArgs {
  userId: string
  experience: Experience
  answers: Record<string, unknown>
}

export function buildMappingMessages({ userId, experience, answers }: BuildArgs): ChatCompletionMessageParam[] {
  const system = [
    'You are a sommelier data normalizer.',
    'Return STRICT JSON that conforms exactly to the requested schema keys.',
    'Rules:',
    '- Infer reasonable values from user free-text.',
    '- When uncertain, choose sensible midpoints/defaults rather than refusing.',
    '- All numeric intensities are in [0,1].',
    '- Only include keys present in the requested schema; do not add commentary.',
    '- For aromaAffinities.family use ONLY these exact enum values (snake_case): citrus, stone_fruit, tropical, red_fruit, black_fruit, floral, herbal_green, pepper_spice, earth_mineral, oak_vanilla_smoke, dairy_butter, honey_oxidative.',
    '- Output must be valid JSON (no trailing commas, no comments).',
  ].join('\n')

  // Minimal few-shot cues to bias consistency
  const fewShotUserNovice = {
    role: 'user' as const,
    content: JSON.stringify({
      experience: 'novice',
      answers: {
        free_enjoyed: 'I liked a light white that tasted crisp and citrusy',
        free_disliked: 'Too oaky and buttery',
      },
    }),
  }
  const fewShotAssistantNovice = {
    role: 'assistant' as const,
    content: JSON.stringify({
      userId: 'example',
      stablePalate: { sweetness: 0.3, acidity: 0.7, tannin: 0.1, bitterness: 0.2, body: 0.3, alcoholWarmth: 0.3, sparkleIntensity: 0.4 },
      aromaAffinities: [{ family: 'citrus', affinity: 0.6 }],
      styleLevers: { oak: 0.1, malolacticButter: 0.1, oxidative: 0.2, minerality: 0.6, fruitRipeness: 0.4 },
      contextWeights: [],
      foodProfile: { heatLevel: 2, salt: 0.5, fat: 0.5, sauceSweetness: 0.3, sauceAcidity: 0.6, cuisines: [], proteins: [] },
      preferences: { novelty: 0.5, budgetTier: 'weekend', values: [] },
      dislikes: ['oaky','buttery'],
      sparkling: {},
      wineKnowledge: 'novice',
      flavorMaps: {}
    }),
  }

  // Expert style example focused on structured reds and balanced whites
  const fewShotUserExpert = {
    role: 'user' as const,
    content: JSON.stringify({
      experience: 'expert',
      answers: {
        free_enjoyed: 'Napa Cabernet like Heitz with steak; Northern Rhône Syrah with grilled foods; merlot-leaning Bordeaux for contemplation; Elk Cove Pinot Gris as a comfort white; Sancerre with seafood and Caesar.',
        free_disliked: 'Overly acidic Italian reds; extremely acidic/crisp whites are off-putting; prefer balanced whites.',
        free_contexts: 'Steak dinners, grilled nights, pizza/burger nights, date night, special occasions, friends over.',
        free_descriptors: 'structured, black fruit, pepper spice, mineral, balanced, savory'
      }
    }),
  }
  const fewShotAssistantExpert = {
    role: 'assistant' as const,
    content: JSON.stringify({
      userId: 'example-expert',
      stablePalate: { sweetness: 0.25, acidity: 0.5, tannin: 0.8, bitterness: 0.45, body: 0.8, alcoholWarmth: 0.65, sparkleIntensity: 0.3 },
      aromaAffinities: [
        { family: 'black_fruit', affinity: 0.65 },
        { family: 'pepper_spice', affinity: 0.7 },
        { family: 'earth_mineral', affinity: 0.55 }
      ],
      styleLevers: { oak: 0.65, malolacticButter: 0.25, oxidative: 0.25, minerality: 0.5, fruitRipeness: 0.65 },
      contextWeights: [
        { occasion: 'steak_night', weights: {} },
        { occasion: 'pizza_pasta', weights: {} },
        { occasion: 'celebration_toast', weights: {} }
      ],
      preferences: { novelty: 0.55, budgetTier: 'weekend', values: [] },
      dislikes: [],
      sparkling: { drynessBand: 'Brut', bubbleIntensity: 0.35 },
      wineKnowledge: 'expert',
      flavorMaps: {
        red: { tannin: 0.8, acidity: 0.5, body: 0.8, oak: 0.65, fruitRipeness: 0.65, aromaAffinitiesTop: ['black_fruit','pepper_spice'] },
        white: { acidity: 0.55, body: 0.5, oak: 0.2, aromaAffinitiesTop: ['citrus'] },
        sparkling: { dryness: 'Brut', bubbleIntensity: 0.35 }
      }
    }),
  }

  const user = {
    role: 'user' as const,
    content: JSON.stringify({ userId, experience, answers }),
  }

  return [
    { role: 'system', content: system },
    fewShotUserNovice,
    fewShotAssistantNovice,
    fewShotUserExpert,
    fewShotAssistantExpert,
    user,
  ]
}


