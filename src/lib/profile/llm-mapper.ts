import { OpenAI } from 'openai'
import { UserProfileSchema, type UserProfileInput } from './schema'
import { buildMappingMessages } from './prompt'

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
  model = process.env.OPENAI_MODEL || 'gpt-5'
}: {
  userId: string
  experience: Experience
  answers: FreeTextAnswers
  model?: string
}): Promise<{ profile: UserProfileInput; summary: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const messages = buildMappingMessages({ userId, experience, answers })
  
  async function requestWithFallback(): Promise<string> {
    const candidates = [model, 'gpt-4o', 'gpt-4o-mini']
    let lastErr: any
    for (const m of candidates) {
      try {
        const r = await openai.chat.completions.create({
          model: m,
          messages,
          temperature: 0.15,
          max_tokens: 900,
          response_format: { type: 'json_object' }
        })
        const content = r.choices[0]?.message?.content
        if (content && content.trim().length > 0) {
          return content
        }
      } catch (err: any) {
        lastErr = err
        // try next model
      }
    }
    throw lastErr || new Error('LLM mapping failed')
  }

  const content = await requestWithFallback()

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

  const summary = `Profile created from free-text. Experience: ${experience}.`

  return { profile, summary }
}


