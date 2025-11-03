import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Provide a jest alias for tests that still reference jest APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).jest = vi

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Link to avoid act() warnings from internal state updates during tests
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    React.createElement('a', { href: typeof href === 'string' ? href : '#', ...props }, children)
  )
}))

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Polyfill IntersectionObserver for jsdom environment
if (!(globalThis as any).IntersectionObserver) {
  ;(globalThis as any).IntersectionObserver = class {
    constructor(_cb: any, _options?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
}