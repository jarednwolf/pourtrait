import { OpenAI } from 'openai'
import { UserProfileSchema, AromaFamily, type UserProfileInput } from './schema'
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
  model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
}: {
  userId: string
  experience: Experience
  answers: FreeTextAnswers
  model?: string
}): Promise<{ profile: UserProfileInput; summary: string; usedModel: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const messages = buildMappingMessages({ userId, experience, answers })
  
  async function requestWithFallback(): Promise<{ content: string; usedModel: string }> {
    const candidates = [model, 'gpt-4o-mini', 'gpt-4o'].filter(Boolean)
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
          return { content, usedModel: m }
        }
      } catch (err: any) {
        lastErr = err
        // try next model
      }
    }
    throw lastErr || new Error('LLM mapping failed')
  }

  let content: string | undefined
  let usedModel: string = model
  try {
    const r = await requestWithFallback()
    content = r.content
    usedModel = r.usedModel
  } catch (err: any) {
    const message = err?.message || 'unknown error'
    const status = err?.status || err?.code || err?.name
    const detail = err?.response?.data?.error?.message || err?.error || ''
    const enriched = `${message}${detail ? ` | ${detail}` : ''}`
    const e = new Error(enriched)
    ;(e as any).code = 'openai_request_failed'
    ;(e as any).status = status
    throw e
  }

  const jsonText = extractFirstJsonObject(content || '') ?? content
  if (!jsonText) {
    const e = new Error('Model returned no JSON content')
    ;(e as any).code = 'invalid_model_output'
    throw e
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err: any) {
    const e = new Error('Failed to parse JSON from model output')
    ;(e as any).code = 'invalid_json'
    ;(e as any).outputSample = (content || '').slice(0, 400)
    throw e
  }
  let profile: UserProfileInput
  try {
    profile = UserProfileSchema.parse(parsed)
  } catch (errFirst: any) {
    const normalized = normalizeProfileCandidate(parsed)
    try {
      profile = UserProfileSchema.parse(normalized)
    } catch (err: any) {
      const e = new Error('Model output failed schema validation')
      ;(e as any).code = 'schema_validation_failed'
      ;(e as any).issues = err?.issues || errFirst?.issues || undefined
      ;(e as any).outputSample = (content || '').slice(0, 400)
      throw e
    }
  }
  const summary = `Profile created from free-text. Experience: ${experience}.`
  return { profile, summary, usedModel }
}

function _heuristicProfileFromAnswers(userId: string, experience: Experience, answers: FreeTextAnswers): UserProfileInput {
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

// Try to extract the first JSON object from a string that may include prose or fences
function extractFirstJsonObject(text: string): string | null {
  if (!text) return null
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }
  return null
}

// Normalize model JSON to match schema (one best-effort pass)
function normalizeProfileCandidate(input: any): any {
  const out = structuredClone(input)
  // Clamp scales to [0,1]
  const clamp01 = (n: any) => {
    const x = typeof n === 'number' ? n : Number(n)
    if (Number.isFinite(x)) { return Math.max(0, Math.min(1, x)) }
    return 0.5
  }

  if (out?.stablePalate) {
    const s = out.stablePalate
    for (const k of ['sweetness','acidity','tannin','bitterness','body','alcoholWarmth','sparkleIntensity']) {
      if (k in s) s[k] = clamp01(s[k])
    }
  }

  if (out?.styleLevers) {
    const s = out.styleLevers
    for (const k of ['oak','malolacticButter','oxidative','minerality','fruitRipeness'] as const) {
      if (k in s) s[k] = clamp01(s[k])
    }
  }

  const allowedFamilies = AromaFamily.options as unknown as string[]
  const normalizeFamily = (v: any): string | undefined => {
    if (typeof v !== 'string') return undefined
    const t = v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
    // direct match
    if (allowedFamilies.includes(t)) return t
    // simple contains / typo fixes
    const candidates: Record<string, string[]> = {
      black_fruit: ['blackfruit','dark_fruit','black','lack_fruit'],
      red_fruit: ['redfruit','strawberry','raspberry','cherry'],
      pepper_spice: ['pepper','peppery','spice','pep','pepper_spicy'],
      herbal_green: ['herbal','green','herb'],
      earth_mineral: ['earth','mineral','soil'],
      oak_vanilla_smoke: ['oak','vanilla','smoke','oaky'],
      dairy_butter: ['butter','buttery','dairy','malolactic','malo'],
      honey_oxidative: ['oxidative','honey','sherry'],
      stone_fruit: ['stonefruit','peach','apricot'],
      tropical: ['tropical','pineapple','mango'],
      citrus: ['citrus','lemon','lime','grapefruit'],
      floral: ['floral','flower','violet','rose']
    }
    for (const [fam, keys] of Object.entries(candidates)) {
      if (keys.some(k => t.includes(k))) return fam
    }
    return undefined
  }

  if (Array.isArray(out?.aromaAffinities)) {
    out.aromaAffinities = out.aromaAffinities
      .map((a: any) => {
        const family = normalizeFamily(a?.family)
        const affinity = clamp01((a?.affinity ?? 0.5)) * (a?.affinity < 0 ? -1 : 1)
        return family ? { family, affinity } : null
      })
      .filter(Boolean)
  }

  if (Array.isArray(out?.contextWeights)) {
    const allowedOcc = ['everyday','hot_day_patio','cozy_winter','spicy_food_night','steak_night','seafood_sushi','pizza_pasta','celebration_toast','dessert_night','aperitif']
    out.contextWeights = out.contextWeights
      .map((c: any) => {
        const raw = (c?.occasion || '').toString().toLowerCase().replace(/\s+/g,'_')
        const match = allowedOcc.find(o => raw.includes(o))
        return match ? { occasion: match, weights: c?.weights || {} } : null
      })
      .filter(Boolean)
      .slice(0, 3)
  }

  return out
}


