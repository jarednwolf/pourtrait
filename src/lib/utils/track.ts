export function track(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    const props = { page: window.location.pathname, auth_state: (window as any)?.POURTRAIT_AUTH || 'unknown', ...properties }
    // eslint-disable-next-line no-console
    console.log('[track]', eventName, props)
    if ((window as any).va) {
      try {(window as any).va('track', eventName, props)} catch {}
    }
  }
}

export const events = {
  ctaHeroClick: (action?: string) => track('cta_home_hero_click', { action }),
  ctaTileClick: (tile: string) => track('cta_tile_click', { tile }),
  signupView: () => track('signup_view'),
  signupComplete: () => track('signup_complete'),
  postAuthResume: (type: string) => track('post_auth_resume_intent', { type }),
  // Added dashboard and onboarding analytics helpers
  dashboardViewed: () => track('dashboard_viewed'),
  panelImpression: (panel: string) => track('panel_impression', { panel }),
  onboardingStepViewed: (step: number) => track('onboarding_step_viewed', { step }),
  onboardingStepCompleted: (step: number) => track('onboarding_step_completed', { step }),
  // Funnel instrumentation additions
  quizStarted: () => track('quiz_started'),
  quizAnswered: (id: string) => track('quiz_answered', { id }),
  quizCompleted: () => track('quiz_completed'),
  tasteProfileSaved: () => track('taste_profile_saved'),
  recRequested: (type: string) => track('rec_requested', { type }),
  recShown: (type: string) => track('rec_shown', { type }),
  recFeedback: (type: 'accepted' | 'rejected' | 'modified') => track(`rec_feedback_${type}`),
  consumptionLogged: () => track('consumption_logged'),
  ratingSubmitted: (rating: number) => track('rating_submitted', { rating }),
  cellarImportStarted: () => track('cellar_import_started'),
  cellarImportCompleted: () => track('cellar_import_completed'),
  guestCellarPreviewViewed: () => track('guest_cellar_preview_viewed'),
  chatPromptClicked: (prompt: string) => track('chat_prompt_clicked', { prompt }),
} as const


