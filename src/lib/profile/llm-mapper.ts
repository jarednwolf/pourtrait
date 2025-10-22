import { OpenAI } from 'openai'
import { UserProfileSchema, type UserProfileInput } from './schema'

type Experience = 'novice' | 'intermediate' | 'expert'

export interface FreeTextAnswers {
  free_enjoyed?: string
  free_disliked?: string
  free_contexts?: string
  free_descriptors?: string
  sweetness_prompt?: string
  dryness_bitterness_prompt?: string
}

export async function mapFreeTextToProfile({
  userId,
  experience,
  answers,
  model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
}: {
  userId: string
  experience: Experience
  answers: FreeTextAnswers
  model?: string
}): Promise<{ profile: UserProfileInput; summary: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const system = `You are a sommelier data normalizer. Return STRICT JSON matching the provided schema. 
  - Infer reasonable values from the user's free text.
  - Use defaults when uncertain. 
  - Keep within 0..1 for numeric scales. 
  - Do not include comments.`

  const user = JSON.stringify({ experience, answers })

  const schemaExcerpt = UserProfileSchema.toString()

  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: `Schema (TypeScript/Zod, abbreviated): ${schemaExcerpt}\nUserId: ${userId}\nInput: ${user}\nReturn JSON only with keys of UserProfileSchema.` }
  ]

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
    max_tokens: 900
  })

  const content = completion.choices[0]?.message?.content || '{}'
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    // Fallback minimal profile
    parsed = {
      userId,
      stablePalate: { sweetness: 0.5, acidity: 0.5, tannin: 0.5, bitterness: 0.5, body: 0.5, alcoholWarmth: 0.5, sparkleIntensity: 0.5 },
      aromaAffinities: [],
      styleLevers: { oak: 0.3, malolacticButter: 0.2, oxidative: 0.2, minerality: 0.5, fruitRipeness: 0.5 },
      contextWeights: [],
      preferences: { novelty: 0.5, budgetTier: 'weekend', values: [] },
      dislikes: [],
      sparkling: {},
      wineKnowledge: experience === 'expert' ? 'expert' : experience === 'intermediate' ? 'intermediate' : 'novice',
      flavorMaps: {}
    }
  }

  const profile = UserProfileSchema.parse(parsed)

  const summary = `Profile created from free-text. Experience: ${experience}. Keys present: ${Object.keys(profile).length}.`

  return { profile, summary }
}


