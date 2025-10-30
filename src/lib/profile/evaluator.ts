import type { UserProfileInput } from './schema'

export interface EvaluationCheck {
  id: string
  ok: boolean
  expected?: unknown
  actual?: unknown
  weight: number
  message: string
}

export interface EvaluationResult {
  confidence: number
  checks: EvaluationCheck[]
  commentary: string
}

function normalizeTextMap(freeText?: Record<string, unknown>): string {
  if (!freeText) return ''
  try {
    return Object.values(freeText)
      .filter(Boolean)
      .map(v => String(v).toLowerCase())
      .join(' ')
  } catch {
    return ''
  }
}

function mentions(text: string, tokens: string[]): boolean {
  const t = text.toLowerCase()
  return tokens.some(x => t.includes(x))
}

function qualitative(n: number): string {
  if (n >= 0.75) return 'high'
  if (n >= 0.55) return 'moderate'
  if (n >= 0.35) return 'medium'
  return 'low'
}

export function evaluateProfile(
  profile: UserProfileInput,
  freeText?: Record<string, unknown>,
  experience?: 'novice' | 'intermediate' | 'expert'
): EvaluationResult {
  const text = normalizeTextMap(freeText)
  const checks: EvaluationCheck[] = []

  // Expectations derived from text
  const likesStructuredReds = mentions(text, ['napa cab', 'napa cabernet', 'heitz', 'cabernet', 'northern rhone', 'syrah', 'cote rotie', 'hermitage', 'bordeaux', 'merlot'])
  const whiteSignals = mentions(text, ['pinot gris', 'elk cove', 'sancerre', 'sauvignon blanc'])
  const dislikesHighAcid = mentions(text, ['overly acidic', 'extremely acidic', 'razor-sharp', 'too crisp'])
  const steak = mentions(text, ['steak', 'grilled', 'kabob'])
  const pizza = mentions(text, ['pizza', 'burger'])
  const celebration = mentions(text, ['celebration', 'special occasion', 'date night'])
  const brunchRose = mentions(text, ['lunch', 'brunch', 'rose', 'rosé'])

  const { stablePalate, styleLevers } = profile

  // Core palate checks
  const w1 = 2.0
  if (likesStructuredReds) {
    checks.push({ id: 'reds-tannin', ok: stablePalate.tannin >= 0.7, expected: '>=0.7', actual: stablePalate.tannin, weight: w1, message: 'Structured reds should show higher tannin' })
    checks.push({ id: 'reds-body', ok: stablePalate.body >= 0.7, expected: '>=0.7', actual: stablePalate.body, weight: w1, message: 'Structured reds should show fuller body' })
    checks.push({ id: 'reds-oak', ok: styleLevers.oak >= 0.55 && styleLevers.oak <= 0.75, expected: '0.55–0.75', actual: styleLevers.oak, weight: 1.2, message: 'Moderate oak expected for Napa/Bdx styles' })
  }

  if (whiteSignals) {
    checks.push({ id: 'white-minerality', ok: styleLevers.minerality >= 0.55, expected: '>=0.55', actual: styleLevers.minerality, weight: 1.0, message: 'Sancerre/Pinot Gris imply mineral whites' })
    checks.push({ id: 'white-sweetness', ok: stablePalate.sweetness <= 0.35, expected: '<=0.35', actual: stablePalate.sweetness, weight: 0.8, message: 'Balanced/dry whites preferred' })
  }

  if (dislikesHighAcid) {
    checks.push({ id: 'acidity-cap', ok: stablePalate.acidity <= 0.65, expected: '<=0.65', actual: stablePalate.acidity, weight: 1.2, message: 'User dislikes overly acidic wines' })
  } else {
    // General balance sanity
    checks.push({ id: 'balance-nonflat', ok: (() => {
      const arr = [stablePalate.sweetness, stablePalate.acidity, stablePalate.tannin, stablePalate.bitterness, stablePalate.body]
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length
      const varc = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length
      return varc > 0.0025
    })(), weight: 0.6, message: 'Palate should not be flat at 0.5' })
  }

  // Occasion checks
  const got = new Set(profile.contextWeights?.map(c => c.occasion) || [])
  if (steak) checks.push({ id: 'ctx-steak', ok: got.has('steak_night'), expected: 'steak_night in contexts', actual: Array.from(got).slice(0, 5), weight: 0.7, message: 'Expect steak night context' })
  if (pizza) checks.push({ id: 'ctx-pizza', ok: got.has('pizza_pasta'), expected: 'pizza_pasta in contexts', actual: Array.from(got).slice(0, 5), weight: 0.6, message: 'Expect pizza/pasta context' })
  if (celebration) {
    const ok = ['celebration_toast', 'special_occasion', 'date_night'].some(o => got.has(o as any))
    checks.push({ id: 'ctx-celebration', ok, expected: 'celebration_toast|special_occasion|date_night', actual: Array.from(got).slice(0, 7), weight: 0.5, message: 'Expect celebration/date-night context' })
  }
  if (brunchRose) {
    const ok = ['aperitif', 'everyday', 'lunch_rose', 'eating_out'].some(o => got.has(o as any))
    checks.push({ id: 'ctx-aperitif', ok, expected: 'aperitif|everyday|lunch_rose|eating_out', actual: Array.from(got).slice(0, 7), weight: 0.4, message: 'Expect aperitif/brunch/lighter context' })
  }

  // Flavor map coherence checks (red/white/sparkling)
  const tol = 0.2
  const red = profile.flavorMaps?.red || {}
  const white = profile.flavorMaps?.white || {}
  const sparkling = profile.flavorMaps?.sparkling || {}
  const within = (a?: number, b?: number) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol

  if (Object.keys(red).length) {
    checks.push({ id: 'coherence-red-tannin', ok: within(red.tannin, stablePalate.tannin), expected: stablePalate.tannin, actual: red.tannin, weight: 0.7, message: 'Red map tannin should reflect stable palate' })
    checks.push({ id: 'coherence-red-acidity', ok: within(red.acidity, stablePalate.acidity), expected: stablePalate.acidity, actual: red.acidity, weight: 0.5, message: 'Red map acidity should reflect stable palate' })
    checks.push({ id: 'coherence-red-body', ok: within(red.body, stablePalate.body), expected: stablePalate.body, actual: red.body, weight: 0.5, message: 'Red map body should reflect stable palate' })
    checks.push({ id: 'coherence-red-oak', ok: within(red.oak, styleLevers.oak), expected: styleLevers.oak, actual: red.oak, weight: 0.5, message: 'Red map oak should reflect style levers' })
  }

  if (Object.keys(white).length) {
    checks.push({ id: 'coherence-white-acidity', ok: within(white.acidity, stablePalate.acidity), expected: stablePalate.acidity, actual: white.acidity, weight: 0.5, message: 'White map acidity should reflect stable palate' })
    checks.push({ id: 'coherence-white-body', ok: within(white.body, stablePalate.body), expected: stablePalate.body, actual: white.body, weight: 0.4, message: 'White map body should reflect stable palate' })
    checks.push({ id: 'coherence-white-oak', ok: white.oak === undefined || within(white.oak, Math.min(styleLevers.oak, 0.5)), expected: `<=${Math.min(styleLevers.oak, 0.5).toFixed(2)}`, actual: white.oak, weight: 0.4, message: 'Whites usually show lower oak in this preference set' })
  }

  if (Object.keys(sparkling).length) {
    checks.push({ id: 'coherence-sparkling-bubbles', ok: within(sparkling.bubbleIntensity, stablePalate.sparkleIntensity), expected: stablePalate.sparkleIntensity, actual: sparkling.bubbleIntensity, weight: 0.3, message: 'Sparkling bubble intensity should reflect palate' })
  }

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0) || 1
  const passedWeight = checks.filter(c => c.ok).reduce((s, c) => s + c.weight, 0)
  const confidence = Math.max(0, Math.min(1, passedWeight / totalWeight))

  // Somm commentary (short, contextual)
  const redsLine = likesStructuredReds
    ? `Your reds lean structured and savory (tannin ${qualitative(stablePalate.tannin)}, body ${qualitative(stablePalate.body)}, oak ${qualitative(styleLevers.oak)}).`
    : `Your reds sit around a balanced midpoint with easy drinking structure.`
  const whitesLine = whiteSignals
    ? `For whites you favor mineral, balanced styles like Sancerre/Pinot Gris (sweetness ${qualitative(stablePalate.sweetness)}, acidity ${qualitative(stablePalate.acidity)}).`
    : `Whites look balanced without extremes of sugar or acid.`
  const tipLine = steak
    ? `For steak or grilled nights, try a Napa Cab or N. Rhône Syrah; for pizza/burger, a robust Pinot or Rioja works well.`
    : `Pair richer reds with protein and keep whites crisp‑mineral for seafood and salads.`
  const commentary = `${redsLine} ${whitesLine} ${tipLine}`

  return { confidence, checks, commentary }
}


