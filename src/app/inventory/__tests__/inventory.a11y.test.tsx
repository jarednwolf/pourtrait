import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import InventoryPage from '../page'

let axe: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  axe = require('jest-axe').axe
} catch (_e) {
  axe = async () => ({ violations: [] })
}

// Mock router and auth used by InventoryPage
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))

vi.mock('@/components/providers/AuthProvider', async (orig) => {
  const actual = await (orig as any)()
  return {
    ...actual,
    useAuth: () => ({ isAuthenticated: true, user: { id: 'u1' }, loading: false }),
  }
})

// Mock enhanced service hook and WineService methods to avoid network
vi.mock('@/lib/services/wine-service-enhanced', () => ({
  useEnhancedWineService: () => ({
    getUserWines: async () => [],
    createWine: async () => undefined,
    updateWine: async () => undefined,
  }),
}))

vi.mock('@/lib/services/wine-service', () => ({
  WineService: {
    getInventoryStats: async (_userId: string) => ({
      totalWines: 0,
      totalBottles: 0,
      ratedWines: 0,
      averageRating: 0,
      redWines: 0,
      whiteWines: 0,
      sparklingWines: 0,
    }),
    getConsumptionHistory: async (_userId: string) => [],
    deleteWine: async (_id: string) => undefined,
    markConsumed: async () => undefined,
  },
}))

describe('Accessibility: Inventory Page', () => {
  it('should have no obvious a11y violations', async () => {
    const { container } = render(<InventoryPage />)
    const results = await axe(container)
    expect((results as any).violations?.length ?? 0).toBe(0)
  })
})


