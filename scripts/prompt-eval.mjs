#!/usr/bin/env node
/*
  Local prompt evaluation harness for the onboarding LLM mapper.

  Usage:
    EVAL_LIVE=1 node scripts/prompt-eval.mjs [--only=label]

  - Without EVAL_LIVE, prints built messages (dry run, no API calls).
  - With EVAL_LIVE=1 and OPENAI_API_KEY set, calls the model (OPENAI_MODEL or gpt-5).
*/

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.join(process.cwd()))
const fixturesPath = path.join(ROOT, 'scripts', 'prompt-fixtures.json')
const suitePath = path.join(ROOT, 'scripts', 'prompt-suite.json')

function buildMessages({ userId, experience, answers }) {
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

  const fewShotUserNovice = {
    role: 'user',
    content: JSON.stringify({
      experience: 'novice',
      answers: {
        free_enjoyed: 'I liked a light white that tasted crisp and citrusy',
        free_disliked: 'Too oaky and buttery',
      },
    }),
  }
  const fewShotAssistantNovice = {
    role: 'assistant',
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

  const fewShotUserExpert = {
    role: 'user',
    content: JSON.stringify({
      experience: 'expert',
      answers: {
        free_enjoyed: 'Napa Cabernet like Heitz with steak; Northern Rhône Syrah; merlot-leaning Bordeaux; Elk Cove Pinot Gris; Sancerre with seafood.',
        free_disliked: 'Overly acidic Italian reds; extremely acidic whites.',
        free_contexts: 'Steak dinners, pizza nights, celebration toasts, lunch rosé.',
        free_descriptors: 'structured, black fruit, pepper spice, mineral, balanced'
      }
    })
  }
  const fewShotAssistantExpert = {
    role: 'assistant',
    content: JSON.stringify({
      userId: 'example-expert',
      stablePalate: { sweetness: 0.25, acidity: 0.5, tannin: 0.8, bitterness: 0.45, body: 0.8, alcoholWarmth: 0.65, sparkleIntensity: 0.3 },
      aromaAffinities: [
        { family: 'black_fruit', affinity: 0.65 },
        { family: 'pepper_spice', affinity: 0.7 },
        { family: 'earth_mineral', affinity: 0.55 }
      ],
      styleLevers: { oak: 0.65, malolacticButter: 0.25, oxidative: 0.25, minerality: 0.55, fruitRipeness: 0.65 },
      contextWeights: [
        { occasion: 'steak_night', weights: {} },
        { occasion: 'pizza_pasta', weights: {} },
        { occasion: 'celebration_toast', weights: {} }
      ],
      preferences: { novelty: 0.55, budgetTier: 'weekend', values: [] },
      dislikes: [],
      sparkling: { drynessBand: 'Brut', bubbleIntensity: 0.35 },
      wineKnowledge: 'expert',
      flavorMaps: {}
    })
  }

  const user = { role: 'user', content: JSON.stringify({ userId, experience, answers }) }
  return [ { role: 'system', content: system }, fewShotUserNovice, fewShotAssistantNovice, fewShotUserExpert, fewShotAssistantExpert, user ]
}

function messagesToString(messages) {
  return messages.map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n\n')
}

function parseArgs() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.split('=')[1] : null
  const live = process.env.EVAL_LIVE === '1'
  const evaluate = process.argv.some(a => a === '--evaluate' || a === '--evaluate=1')
  const suite = process.argv.some(a => a === '--suite' || a === '--suite=1')
  return { only, live, evaluate, suite }
}

function loadFixtures() {
  const raw = fs.readFileSync(fixturesPath, 'utf-8')
  return JSON.parse(raw)
}

async function main() {
  const { only, live, evaluate, suite } = parseArgs()
  const fixtures = loadFixtures()
  let selected = only ? fixtures.filter(f => f.label === only) : fixtures
  let suiteExpect = {}
  if (suite) {
    try { suiteExpect = JSON.parse(fs.readFileSync(suitePath, 'utf-8')).reduce((m, x) => (m[x.label] = x.expect || {}, m), {}) } catch {}
    // If suite includes additional cases not in fixtures, merge them in
    try {
      const fromSuite = JSON.parse(fs.readFileSync(suitePath, 'utf-8'))
      for (const item of fromSuite) {
        if (!fixtures.find(f => f.label === item.label)) {
          selected.push({ label: item.label, experience: item.experience || 'intermediate', answers: item.answers || {} })
        }
      }
    } catch {}
  }
  if (!selected.length) {
    console.error('No fixtures matched.');
    process.exit(1)
  }

  if (!live) {
    for (const fx of selected) {
      const messages = buildMessages({ userId: 'fixture-user', experience: fx.experience, answers: fx.answers })
      console.log(`\n--- DRY RUN: ${fx.label} ---`)
      console.log(JSON.stringify(messages, null, 2))
    }
    console.log('\nSet EVAL_LIVE=1 to run model calls. OPENAI_API_KEY is required.')
    return
  }

  const { OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_MODEL || 'gpt-5'

  for (const fx of selected) {
    const messages = buildMessages({ userId: 'fixture-user', experience: fx.experience, answers: fx.answers })
    console.log(`\n--- LIVE RUN: ${fx.label} ---`)
    const started = Date.now()
    try {
      let content
      if ((model || '').startsWith('gpt-5')) {
        try {
          const resp = await client.responses.create({
            model,
            input: messagesToString(messages),
            max_output_tokens: 1500,
            reasoning: { effort: 'low' }
          })
          content = resp.output_text || (resp.output?.[0]?.content?.[0]?.text) || ''
          if (!content) {
            console.log('raw response (truncated):', JSON.stringify(resp).slice(0, 2000))
          }
        } catch (err) {
          throw err
        }
      } else {
        const completion = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.15,
          max_tokens: 900,
          response_format: { type: 'json_object' }
        })
        content = completion.choices?.[0]?.message?.content || '{}'
      }
      const ms = Date.now() - started
      let parsed
      try { parsed = JSON.parse(content || '{}') } catch { parsed = { parseError: true, content } }
      console.log('latencyMs=', ms)
      console.dir(parsed, { depth: null })
      // Lightweight validation
      const sp = parsed?.stablePalate || {}
      const sl = parsed?.styleLevers || {}
      const rangesOk = ['sweetness','acidity','tannin','bitterness','body','alcoholWarmth','sparkleIntensity']
        .every(k => typeof sp[k] === 'number' && sp[k] >= 0 && sp[k] <= 1)
      const styleOk = ['oak','malolacticButter','oxidative','minerality','fruitRipeness']
        .every(k => typeof sl[k] === 'number' && sl[k] >= 0 && sl[k] <= 1)
      const notFlat = (() => {
        const vals = ['sweetness','acidity','tannin','bitterness','body'].map(k => Number(sp[k] ?? 0.5))
        const mean = vals.reduce((a,b)=>a+b,0)/vals.length
        const varc = vals.reduce((a,b)=>a + Math.pow(b-mean,2),0)/vals.length
        return varc > 0.0025
      })()
      console.log('validation:', { rangesOk, styleOk, notFlat })

      if (evaluate && !(parsed && parsed.stablePalate && parsed.styleLevers)) {
        console.log('evaluation: skipped (invalid profile)')
      } else if (evaluate) {
        const text = fx.answers || {}
        const txt = Object.values(text).filter(Boolean).map(v => String(v).toLowerCase()).join(' ')
        const likesStructuredReds = /napa cab|cabernet|heitz|northern rhone|syrah|bordeaux|merlot/.test(txt)
        const whiteSignals = /pinot gris|elk cove|sancerre|sauvignon blanc/.test(txt)
        const dislikesHighAcid = /overly acidic|extremely acidic|too crisp/.test(txt)
        const steak = /steak|grilled|kabob/.test(txt)
        const pizza = /pizza|burger/.test(txt)
        const celebration = /celebration|special occasion|date night/.test(txt)
        const brunchRose = /lunch|brunch|rose|rosé/.test(txt)

        const checks = []
        const push = (id, ok, expected, actual) => checks.push({ id, ok, expected, actual })
        if (likesStructuredReds) {
          push('reds-tannin>=0.7', sp.tannin >= 0.7, '>=0.7', sp.tannin)
          push('reds-body>=0.7', sp.body >= 0.7, '>=0.7', sp.body)
          push('reds-oak~0.55-0.75', sl.oak >= 0.55 && sl.oak <= 0.75, '0.55-0.75', sl.oak)
        }
        if (whiteSignals) {
          push('white-minerality>=0.55', sl.minerality >= 0.55, '>=0.55', sl.minerality)
          push('white-sweetness<=0.35', sp.sweetness <= 0.35, '<=0.35', sp.sweetness)
        }
        if (dislikesHighAcid) {
          push('acidity<=0.65', sp.acidity <= 0.65, '<=0.65', sp.acidity)
        }
        // non-flat
        push('nonflat', notFlat, '>0.05 stddev approx', 'computed')
        // contexts (best-effort from parsed flavorMaps/contextWeights if present)
        const got = new Set((parsed.contextWeights || []).map(c => c.occasion))
        if (steak) push('ctx-steak', got.has('steak_night'), 'steak_night', Array.from(got))
        if (pizza) push('ctx-pizza', got.has('pizza_pasta'), 'pizza_pasta', Array.from(got))
        if (celebration) push('ctx-celebration', got.has('celebration_toast'), 'celebration_toast', Array.from(got))
        if (brunchRose) push('ctx-aperitif', got.has('aperitif') || got.has('everyday'), 'aperitif|everyday', Array.from(got))

        // Suite expectations override or augment generic checks
        const exp = suiteExpect[fx.label] || {}
        const suiteChecks = []
        const inRange = (v, [lo, hi]) => typeof v === 'number' && v >= lo && v <= hi
        if (exp.tannin_min !== undefined) suiteChecks.push({ id: 'suite-tannin_min', ok: (sp.tannin ?? 0) >= exp.tannin_min, expected: `>=${exp.tannin_min}`, actual: sp.tannin })
        if (exp.tannin_max !== undefined) suiteChecks.push({ id: 'suite-tannin_max', ok: (sp.tannin ?? 1) <= exp.tannin_max, expected: `<=${exp.tannin_max}`, actual: sp.tannin })
        if (exp.body_min !== undefined) suiteChecks.push({ id: 'suite-body_min', ok: (sp.body ?? 0) >= exp.body_min, expected: `>=${exp.body_min}`, actual: sp.body })
        if (exp.acidity_max !== undefined) suiteChecks.push({ id: 'suite-acidity_max', ok: (sp.acidity ?? 1) <= exp.acidity_max, expected: `<=${exp.acidity_max}`, actual: sp.acidity })
        if (exp.sweetness_min !== undefined) suiteChecks.push({ id: 'suite-sweetness_min', ok: (sp.sweetness ?? 0) >= exp.sweetness_min, expected: `>=${exp.sweetness_min}`, actual: sp.sweetness })
        if (exp.sweetness_max !== undefined) suiteChecks.push({ id: 'suite-sweetness_max', ok: (sp.sweetness ?? 1) <= exp.sweetness_max, expected: `<=${exp.sweetness_max}`, actual: sp.sweetness })
        if (exp.oak_min !== undefined) suiteChecks.push({ id: 'suite-oak_min', ok: (sl.oak ?? 0) >= exp.oak_min, expected: `>=${exp.oak_min}`, actual: sl.oak })
        if (exp.oak_max !== undefined) suiteChecks.push({ id: 'suite-oak_max', ok: (sl.oak ?? 1) <= exp.oak_max, expected: `<=${exp.oak_max}`, actual: sl.oak })
        if (Array.isArray(exp.oak_range)) suiteChecks.push({ id: 'suite-oak_range', ok: inRange(sl.oak ?? 0, exp.oak_range), expected: `${exp.oak_range[0]}-${exp.oak_range[1]}`, actual: sl.oak })
        if (Array.isArray(exp.aromas)) suiteChecks.push({ id: 'suite-aromas_all', ok: (exp.aromas || []).every(a => (parsed.aromaAffinities || []).some((x) => x.family === a)), expected: exp.aromas.join(','), actual: (parsed.aromaAffinities || []).map(x => x.family).join(',') })
        if (Array.isArray(exp.aromas_any)) suiteChecks.push({ id: 'suite-aromas_any', ok: (exp.aromas_any || []).some(a => (parsed.aromaAffinities || []).some((x) => x.family === a)), expected: exp.aromas_any.join(','), actual: (parsed.aromaAffinities || []).map(x => x.family).join(',') })
        if (Array.isArray(exp.contexts_any)) suiteChecks.push({ id: 'suite-contexts_any', ok: (exp.contexts_any || []).some(c => (parsed.contextWeights || []).some((x) => x.occasion === c)), expected: exp.contexts_any.join(','), actual: (parsed.contextWeights || []).map(x => x.occasion).join(',') })

        const allChecks = checks.concat(suiteChecks)
        const failed = allChecks.filter(c => !c.ok)
        console.log('evaluation checks:', { total: allChecks.length, failed: failed.length })
        if (failed.length) {
          console.table(failed)
        }
      }
    } catch (e) {
      console.error('Error:', e?.message || e)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


