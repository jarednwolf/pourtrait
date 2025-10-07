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


