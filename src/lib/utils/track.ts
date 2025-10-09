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
} as const


