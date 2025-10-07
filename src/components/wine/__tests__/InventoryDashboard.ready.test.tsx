import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InventoryDashboard } from '../InventoryDashboard'

describe('InventoryDashboard Ready Pill', () => {
  it('shows ready-to-drink count', () => {
    const wines: any[] = [
      { drinkingWindow: { peakStartDate: new Date(), peakEndDate: new Date(Date.now()+86400000), latestDate: new Date(Date.now()+86400000*30), earliestDate: new Date(Date.now()-86400000*5) } },
      { drinkingWindow: { peakStartDate: new Date(Date.now()+86400000*10), peakEndDate: new Date(Date.now()+86400000*20), latestDate: new Date(Date.now()+86400000*40), earliestDate: new Date() } },
    ]
    render(<InventoryDashboard stats={{ totalWines: 2, totalBottles: 2, ratedWines: 0, averageRating: 0, redWines: 1, whiteWines: 1, sparklingWines: 0 }} wines={wines as any} />)
    expect(screen.getByText(/ready/)).toBeInTheDocument()
  })
})



