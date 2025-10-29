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

  const user = {
    role: 'user' as const,
    content: JSON.stringify({ userId, experience, answers }),
  }

  return [
    { role: 'system', content: system },
    fewShotUserNovice,
    fewShotAssistantNovice,
    user,
  ]
}


