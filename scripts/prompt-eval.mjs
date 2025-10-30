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

function buildMessages({ userId, experience, answers }) {
  const system = [
    'You are a sommelier data normalizer.',
    'Return STRICT JSON that conforms exactly to the requested schema keys.',
    'Rules:',
    '- Infer reasonable values from user free-text.',
    '- When uncertain, choose sensible midpoints/defaults rather than refusing.',
    '- All numeric intensities are in [0,1].',
    '- Only include keys present in the requested schema; do not add commentary.',
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

  const user = { role: 'user', content: JSON.stringify({ userId, experience, answers }) }
  return [ { role: 'system', content: system }, fewShotUserNovice, fewShotAssistantNovice, user ]
}

function messagesToString(messages) {
  return messages.map(m => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n\n')
}

function parseArgs() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.split('=')[1] : null
  const live = process.env.EVAL_LIVE === '1'
  return { only, live }
}

function loadFixtures() {
  const raw = fs.readFileSync(fixturesPath, 'utf-8')
  return JSON.parse(raw)
}

async function main() {
  const { only, live } = parseArgs()
  const fixtures = loadFixtures()
  const selected = only ? fixtures.filter(f => f.label === only) : fixtures
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
            max_output_tokens: 900
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
    } catch (e) {
      console.error('Error:', e?.message || e)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


