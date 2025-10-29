<!-- bb886fdb-4dd6-4f35-8ed2-d7d97105145e 3b02c92f-ee03-4eb5-a1c9-98514a639fda -->
# Pre‑auth personalized preview with loader (local‑only)

## Goal

- Deliver immediate personalization before signup. After the quiz, show a loader (“Painting your pourtrait… this can take 1–2 minutes”), run GPT‑5 mapping, then render a real profile preview with CTA to sign up and save. On signup, persist to DB and log creation.

## UX flow

- Step1 submit (guest) → `/onboarding/preview` loader.
- Loader starts mapping, then swaps to personalized preview (bars + summary) with CTA “Save my profile”.
- Signup completes → finish callback detects preview profile → upsert → redirect to dashboard/summary.

## Data flow and storage

- Pre‑auth: keep `pourtrait_quiz_responses_v1` and `pourtrait_profile_preview_v1` in localStorage.
- On conversion: POST `/api/profile/upsert` with preview profile; server writes to `palate_profiles`, `aroma_preferences`, `context_preferences`, `food_profiles`, and marks onboarding complete in `user_profiles`. Track `profile_created`.

## API contract (new)

- POST `/api/profile/map/preview` (Node)
- Input: `{ experience: 'novice'|'intermediate'|'expert', freeTextAnswers: Record<string,string> }`
- Output: `{ success: true, data: { profile: UserProfileInput, summary: string } }`
- Behavior: no DB writes; logs `preview_map_started/completed/failed` with latency; simple cookie timestamp throttle.

## Loader + Preview UI

- File: `src/app/onboarding/preview/page.tsx`
- Accessibility: H1 receives focus on mount; container `aria-busy=true` while loading; clear status text.
- Preview render: use `ProfileSummary`, mapping UserProfileInput to display fields:
- stablePalate.x → `sweetness|acidity|tannin|bitterness|body|alcohol_warmth|sparkle_intensity`
- styleLevers.x → `oak|malolactic_butter|oxidative|minerality|fruit_ripeness`
- dislikes → badges
- CTA: “Save my profile” → `/auth/signup?next=/dashboard` and track `preview_signup_clicked`.

## Step1 changes

- If user present → keep current behavior.
- If guest → on complete, route to `/onboarding/preview` (do not route directly to signup).

## Finish callback

- Prefer `pourtrait_profile_preview_v1`:
- Upsert via `/api/profile/upsert`, track `profile_created` with `{ source: 'preview', used_llm: true }`.
- Clear both local keys; then redirect to `/onboarding/summary`.
- Fallback: run mapping using saved answers (existing path).

## Analytics & tests

- Events: `preview_viewed`, `preview_map_started|completed|failed`, `preview_signup_clicked`, `profile_created`.
- Tests: jest‑axe for loader; smoke test that preview page focuses H1 and toggles from loading→summary on mocked API.

## Risks & mitigations

- LLM latency: loader copy sets expectation (1–2 min). Consider spinner + progress affordance; in v2, show partial skeleton after 10s.
- Abuse of preview endpoint: cookie‑based throttle now; add IP‑level rate limiting later if needed.

## Rollout & acceptance criteria

- Accept when: guest completes quiz → sees loader → receives personalized preview; signup writes same profile to DB; authenticated summary/insights reflect those values; events emitted.

## Files to add

- `src/app/api/profile/map/preview/route.ts`
- `src/app/onboarding/preview/page.tsx`
- `src/app/__tests__/onboarding.preview.a11y.test.tsx`

## Files to edit

- `src/app/onboarding/step1/page.tsx` (redirect)
- `src/app/auth/callback/finish/page.tsx` (preview upsert + track)

### To‑dos

- [x] Create unauthenticated POST /api/profile/map/preview using GPT‑5 mapper
- [x] Add loader preview page, map profile to ProfileSummary, CTA to signup
- [x] Map UserProfileInput to ProfileSummary DB‑shape props
- [x] Redirect unauthenticated quiz completion to /onboarding/preview
- [x] Upsert preview profile on auth finish and track profile_created
- [x] Emit preview_viewed/map_started/completed/failed and signup_clicked events
- [x] Add jest‑axe loader a11y test and focus assertion
- [x] Document preview flow, local keys, and conversion persistence

### To-dos

- [x] Set default model to gpt-5 in llm-mapper and env docs
- [x] Create onboarding summary page with accessible headings and CTA
- [x] Update auth finish flow to route to /onboarding/summary
- [x] Create authenticated /profile page reusing ProfileSummary
- [x] Add profile insights link/button on dashboard
- [x] Build ProfileSummary component (dims + AI summary)
- [x] Track mapping and summary view events
- [x] Add jest-axe tests for summary page
- [x] Document OPENAI_MODEL=gpt-5 and Vercel env setup
