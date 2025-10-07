import { describe, it, expect } from 'vitest'
import { readinessScore, getDrinkStatus, fromDrinkingWindow } from '../drinking-window-readiness'

describe('drinking-window-readiness', () => {
  it('returns low score when no bounds', () => {
    expect(readinessScore()).toBeGreaterThanOrEqual(0)
    expect(readinessScore()).toBeLessThanOrEqual(1)
  })

  it('peaks near midpoint when both bounds known', () => {
    const now = Date.now()
    const start = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const end = new Date(now + 30 * 24 * 60 * 60 * 1000)
    const centerScore = readinessScore({ start, end })
    expect(centerScore).toBeGreaterThan(0.7)
  })

  it('ramps up as approaching end when only end known', () => {
    const endSoon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    const farEnd = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
    expect(readinessScore({ end: endSoon })).toBeGreaterThan(readinessScore({ end: farEnd }))
  })

  it('ramps after start when only start known', () => {
    const justStarted = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    const longStarted = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    expect(readinessScore({ start: longStarted })).toBeGreaterThan(readinessScore({ start: justStarted }))
  })

  it('maps score to status', () => {
    expect(getDrinkStatus(0.9)).toBe('at_peak')
    expect(getDrinkStatus(0.6)).toBe('drink_soon')
    expect(getDrinkStatus(0.05)).toBe('too_young')
  })

  it('returns over when latestDate in past', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    const res = fromDrinkingWindow({
      earliestDate: past,
      peakStartDate: past,
      peakEndDate: past,
      latestDate: past,
      currentStatus: 'over_hill'
    } as any)
    expect(res.status).toBe('over')
  })
})



