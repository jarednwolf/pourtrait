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
        let content: string | undefined
        if (m.startsWith('gpt-5')) {
          // Prefer Responses API for GPT‑5 models
          try {
            const resp = await openai.responses.create({
              model: m,
              input: messages as any,
              temperature: 0.15,
              // Some SDKs use max_output_tokens; older runtimes expect max_completion_tokens
              max_output_tokens: 900,
              response_format: { type: 'json_object' as any }
            } as any)
            // Try to read output_text helper, then fall back to manual extraction
            content = (resp as any).output_text || (resp as any).text || JSON.stringify(resp)
            if (!content && (resp as any).output?.[0]?.content?.[0]?.text) {
              content = (resp as any).output[0].content[0].text
            }
          } catch (err) {
            // Retry with alternate parameter name if required by the backend
            const resp2 = await (openai as any).responses.create({
              model: m,
              input: messages as any,
              temperature: 0.15,
              max_completion_tokens: 900,
              response_format: { type: 'json_object' }
            })
            content = (resp2 as any).output_text || (resp2 as any).text || JSON.stringify(resp2)
            if (!content && (resp2 as any).output?.[0]?.content?.[0]?.text) {
              content = (resp2 as any).output[0].content[0].text
            }
          }
        } else {
          const r = await openai.chat.completions.create({
            model: m,
            messages,
            temperature: 0.15,
            max_tokens: 900,
            response_format: { type: 'json_object' }
          })
          content = r.choices[0]?.message?.content
        }
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

  let profile: UserProfileInput
  try {
    profile = UserProfileSchema.parse(parsed)
  } catch {
    // Shape mismatch fallback to safe defaults based on experience
    profile = heuristicProfileFromAnswers(userId, experience, answers)
  }

  const summary = `Profile created from free-text. Experience: ${experience}.`

  return { profile, summary }
}

function heuristicProfileFromAnswers(userId: string, experience: Experience, answers: FreeTextAnswers): UserProfileInput {
  const text = Object.values(answers).filter(Boolean).join(' ').toLowerCase()

  const mentions = (tokens: string[]) => tokens.some(t => text.includes(t))

  const lovesCab = mentions(['napa cab', 'napa cabernet', 'cabernet', 'heitz'])
  const lovesSyrah = mentions(['northern rhone', 'syrah', 'cote rotie', 'hermitage'])
  const lovesBordeaux = mentions(['bordeaux', 'merlot'])
  const lovesPinotGris = mentions(['pinot gris'])
  const lovesSancerre = mentions(['sancerre', 'sauvignon blanc'])
  const dislikesHighAcid = mentions(['overly acidic', 'extremely acidic'])
  const steak = mentions(['steak', 'grilled', 'kabob'])
  const pizza = mentions(['pizza', 'burger'])
  const celebration = mentions(['special occasion', 'date night', 'friends', 'family'])

  // Base palate leaning towards structured reds
  const stablePalate = {
    sweetness: 0.25,
    acidity: dislikesHighAcid ? 0.45 : 0.55,
    tannin: lovesCab || lovesSyrah || lovesBordeaux ? 0.75 : 0.55,
    bitterness: 0.4,
    body: lovesCab || lovesBordeaux ? 0.75 : 0.6,
    alcoholWarmth: 0.6,
    sparkleIntensity: 0.3,
  }

  const styleLevers = {
    oak: lovesCab || lovesBordeaux ? 0.65 : 0.45,
    malolacticButter: 0.25,
    oxidative: 0.25,
    minerality: lovesSancerre ? 0.6 : 0.4,
    fruitRipeness: lovesCab || lovesBordeaux ? 0.65 : 0.5,
  }

  const aromaAffinities = [
    lovesSyrah ? { family: 'pepper_spice' as const, affinity: 0.7 } : null,
    lovesCab || lovesBordeaux ? { family: 'black_fruit' as const, affinity: 0.6 } : null,
    lovesSancerre || lovesPinotGris ? { family: 'citrus' as const, affinity: 0.55 } : null,
    { family: 'earth_mineral' as const, affinity: 0.5 },
  ].filter(Boolean) as UserProfileInput['aromaAffinities']

  const occasions = [
    steak ? 'steak_night' : 'everyday',
    pizza ? 'pizza_pasta' : 'everyday',
    celebration ? 'celebration_toast' : 'everyday',
  ]

  const contextWeights = Array.from(new Set(occasions)).slice(0, 3).map((o) => ({
    occasion: o as any,
    weights: {},
  }))

  const dislikes: string[] = []

  const preferences = {
    novelty: 0.55,
    budgetTier: 'weekend' as const,
    values: [] as string[],
  }

  const profile: UserProfileInput = {
    userId,
    stablePalate,
    aromaAffinities,
    styleLevers,
    contextWeights,
    foodProfile: undefined,
    preferences,
    dislikes,
    sparkling: { drynessBand: 'Brut', bubbleIntensity: 0.4 },
    wineKnowledge: experience === 'expert' ? 'expert' : experience === 'intermediate' ? 'intermediate' : 'novice',
    flavorMaps: {
      red: { tannin: stablePalate.tannin, acidity: stablePalate.acidity, body: stablePalate.body, oak: styleLevers.oak, fruitRipeness: styleLevers.fruitRipeness, aromaAffinitiesTop: ['black_fruit','pepper_spice'] },
      white: { acidity: stablePalate.acidity, body: 0.5, oak: 0.2, aromaAffinitiesTop: ['citrus'] },
      sparkling: { dryness: 'Brut', bubbleIntensity: stablePalate.sparkleIntensity },
    }
  }

  return profile
}


