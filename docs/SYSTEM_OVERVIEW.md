# Pourtrait – Current System Overview (October 2025)

## Product state
- Deployed on Vercel, linked to GitHub; Supabase (Postgres + Auth + RLS) as data + auth.
- Onboarding is end‑to‑end with a pre‑auth, LLM‑powered preview flow and post‑auth finalize.
- Authenticated UX routes to `/dashboard`; users can view their profile insights at `/profile`.

## Tech stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind, PWA via next‑pwa/Workbox.
- Backend: Next.js Route Handlers (Node for privileged ops; Edge for light/read routes).
- Data/Auth: Supabase (Postgres + Auth, RLS). SQL migrations in `supabase/migrations`.
- AI: OpenAI GPT‑5 (Responses API) for free‑text onboarding mapping; automatic fallback to GPT‑4o/4o‑mini in the server mapper when needed; Zod schema validation and heuristic fallback.
- Testing: Vitest, @testing-library/react, jest‑axe; live eval harness for LLM mapping.
- Observability: per‑run logging to `llm_mapping_runs`, daily rollups to `llm_daily_stats`, metrics endpoints and admin dashboard.

## Core flows
### Onboarding (guest → preview → signup)
1. Taste quiz saves responses in `localStorage` (`pourtrait_quiz_responses_v1`).
2. Finish routes to `/onboarding/preview` (loader: “Painting your pourtrait…”).
3. Preview calls `POST /api/profile/map/preview` (Node):
   - Builds messages and invokes GPT‑5 Responses API (fallbacks if needed).
   - Validates output with Zod; evaluator computes confidence + diagnostics.
   - Returns `{ profile, summary, commentary, evaluation }`.
   - Logs a run in `llm_mapping_runs` (anon_id + excerpt/hash only).
4. UI renders bars + commentary + confidence; guest CTA is “Save my profile”.
5. After signup/callback: `/auth/callback/finish` upserts preview profile to DB, logs events, and routes to `/onboarding/summary`.

### Authenticated
- `/profile` shows ProfileSummary (bars, commentary, confidence).
- `/dashboard` includes a link to Profile insights and recs entry points.

## AI mapping and evaluator
- Mapper: `src/lib/profile/llm-mapper.ts`
  - Default model `OPENAI_MODEL` (gpt‑5); for GPT‑5 uses Responses API with `max_output_tokens`.
  - Falls back to 4o/4o‑mini if call fails; parses JSON via Zod; heuristic fill‑ins to avoid complete failure.
  - Returns `{ profile, summary, usedModel }`.
- Evaluator: `src/lib/profile/evaluator.ts`
  - Rule‑based expectations from free‑text signals (e.g., Napa Cab/Syrah/Bdx → tannin/body/oak; Sancerre/Pinot Gris → minerality/balanced sweetness; dislikes → acidity cap).
  - Coherence checks between red/white/sparkling flavor maps and stable palate; context checks with synonym matching (pizza_pasta ⇢ pizza_burger_night, etc.).
  - Outputs `confidence`, `checks`, and a 2–3 sentence somm commentary.

## APIs (selected)
- `POST /api/profile/map` (Node): auth required; maps free‑text to profile; evaluator; logs to `llm_mapping_runs`.
- `POST /api/profile/map/preview` (Node): unauthenticated; same mapping/evaluator; logs run with `anon_id`.
- `POST /api/profile/upsert` (Node): service role upserts palate/aroma/context/food into DB; sets onboarding complete.
- `GET/POST /api/profile/summary`: AI summary for an existing profile.
- `POST /api/metrics/llm-map/log`: authenticated by `x-ingest-key`; allows harness uploads of suite results.
- `GET /api/metrics/llm-map-digest?days=7`: aggregate metrics over time window.
- `GET /api/metrics/llm-map-rollup?offset=1`: compute/store prior day’s rollup to `llm_daily_stats`.

## Logging and metrics
- Per‑run logging table: `llm_mapping_runs(user_id|anon_id, model, latency_ms, confidence, success, answers_excerpt, answers_hash, checks)` with indexes.
- Daily rollups table: `llm_daily_stats(day, totals, averages, failure_rate, models jsonb)`.
- Cron jobs in `vercel.json`:
  - `0 2 * * *` → digest endpoint
  - `5 2 * * *` → rollup endpoint
- Admin dashboard: `/(auth)/admin/llm` (totals, averages, per‑model stats).

## Developer tooling
- Live eval harness: `scripts/prompt-eval.mjs`
  - Run one: `EVAL_LIVE=1 OPENAI_API_KEY=... OPENAI_MODEL=gpt-5 node scripts/prompt-eval.mjs --only=expert_user_case --evaluate`
  - Run suite: `... node scripts/prompt-eval.mjs --suite --evaluate`
  - Upload: add `--upload` with `INGEST_URL=/api/metrics/llm-map/log` and `METRICS_INGEST_KEY` set.
  - Suite cases defined in `scripts/prompt-suite.json` (10 diverse personas with expectations).

## Completed (high‑impact)
- Pre‑auth LLM preview with loader and personalized bars; post‑auth finalize.
- GPT‑5 Responses API integration with Zod validation + evaluator confidence + commentary.
- Profile insights page and dashboard entry.
- Logging + daily rollups + metrics endpoints + admin page.
- Context synonym handling; non‑flat sanity; coherent flavor map checks.
- A11y coverage on preview and core pages; type‑checks and lints clean.

## Known gaps / next work
- Alerts: optional Slack/webhook (deferred by decision).
- Cross‑device preview continuity (server “preview_profiles” store) if needed.
- Expand suite coverage for additional cuisines/regions and sparkling styles.
- Strengthen security around ingest: IP allowlist/rate limiting; rotate `METRICS_INGEST_KEY`.
- UI: richer profile summary (per‑dimension confidence), quick actions to recs.
- Performance: consider `next/font/local`, image size tuning for hero assets.

## Environment variables (additions)
- `OPENAI_MODEL` (default `gpt-5`)
- `NEXT_PUBLIC_PROMPT_VERSION`, `NEXT_PUBLIC_EVALUATOR_VERSION` (optional; surfaced in logs)
- `METRICS_INGEST_KEY`, `LLM_LOG_SALT` (ingest + hashing)

## File map (key)
- Mapping: `src/lib/profile/llm-mapper.ts`, evaluator: `src/lib/profile/evaluator.ts`
- Onboarding preview: `src/app/onboarding/preview/page.tsx`
- Profile insights: `src/app/(auth)/profile/page.tsx`
- Metrics: `src/app/api/metrics/*`, admin: `src/app/(auth)/admin/llm/page.tsx`
- Logging schema: `supabase/migrations/*llm_*`

---
This document is the source‑of‑truth overview. Keep it updated alongside any changes to onboarding, mapping, evaluator rules, or metrics.