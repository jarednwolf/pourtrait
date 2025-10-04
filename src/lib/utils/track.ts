export function track(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    // Basic, no-op style tracking for development/demo
    // Replace with real analytics later
    // eslint-disable-next-line no-console
    console.log('[track]', eventName, properties || {})
  }
}


