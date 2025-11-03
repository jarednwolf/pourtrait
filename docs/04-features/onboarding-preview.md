# Onboarding Preview Personalization (Pre‑Auth)

## Overview
Delivers immediate personalization before signup. After the quiz, we show a loader ("Painting your pourtrait… this can take 1–2 minutes"), run GPT‑5 mapping, and render a real profile preview. When the user signs up, the preview profile is saved to the database and becomes their account profile.

## UX Flow
- Guest completes the quiz → routed to `/onboarding/preview`.
- Loader starts; once mapping completes, the page renders the personalized preview (bars + summary) using `ProfileSummary`.
- CTA “Save my profile” sends the user to signup; after auth, the finish callback upserts the preview to DB and redirects to `next` (defaults to `/dashboard`).

## Storage
- Local-only for v1 (cross-device can be added later).
- Keys:
  - `pourtrait_quiz_responses_v1`: raw quiz responses (array of `{ questionId, value, timestamp }`).
  - `pourtrait_profile_preview_v1`: object `{ profile: UserProfileInput, summary: string }` from GPT‑5 mapper.

## API
- `POST /api/profile/map/preview` (Node)
  - Input: `{ experience: 'novice'|'intermediate'|'expert', freeTextAnswers: Record<string,string> }`
  - Output: `{ success: true, data: { profile: UserProfileInput, summary: string } }`
  - No DB writes. Logs `preview_map_started/completed/failed` with latency. Simple cookie throttle via `pp_preview_ts` (~10s).

## Conversion (Post‑Auth)
- `src/app/auth/callback/finish/page.tsx` checks `pourtrait_profile_preview_v1` first.
- If present: upsert via `POST /api/profile/upsert`, then emits `profile_created` through `POST /api/interactions/track` with `{ reasons: ['profile_created'], context: { source: 'preview', used_llm: true } }`.
- Clears both local keys and redirects to the `next` param (defaults to `/dashboard`).
- If absent: falls back to mapping from saved quiz answers.

## Data Model Touchpoints
- `palate_profiles`: stable palate and style levers + meta fields.
- `aroma_preferences`: replaces rows per user on upsert.
- `context_preferences`: replaces rows per user on upsert.
- `food_profiles`: optional food calibrators upsert.
- `user_profiles`: onboarding completion flag handled by server route.

## Accessibility
- Preview loader sets focus to H1 on mount and uses `aria-busy` while loading.
- Jest‑axe test covers loader semantics and focus.

## Observability
- Logs: `preview_viewed`, `preview_map_started`, `preview_map_completed`, `preview_map_failed`, `preview_signup_clicked`, and `profile_created` (via interactions API).

## Notes & Next
- Latency expectation is set to 1–2 minutes; consider progressive affordances or streaming in v2.
- For cross-device continuity, introduce a short‑lived server `preview_profiles` store keyed by a cookie.
