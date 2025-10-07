import { DrinkingWindow } from '@/types'

export type DrinkStatus = 'too_young' | 'at_peak' | 'drink_soon' | 'over'

/**
 * Smooth S-curve readiness scoring for drinking windows.
 * Returns 0..1, where 1 ~ peak readiness.
 */
export function readinessScore(window?: {
  start?: string | Date | null
  end?: string | Date | null
}): number {
  if (!window) {return 0}
  const now = Date.now()
  const start = window.start ? new Date(window.start).getTime() : undefined
  const end = window.end ? new Date(window.end).getTime() : undefined

  // If neither bound is known, return neutral low readiness
  if (!start && !end) {return 0.2}

  // Helper: logistic curve centered at t=0
  const logistic = (t: number) => 1 / (1 + Math.exp(-t))

  // Normalize time around midpoint when both bounds exist
  if (start && end && end > start) {
    const mid = (start + end) / 2
    const span = (end - start) / 6 // 6σ ~ full window mapped to ~±3
    const t = (now - mid) / Math.max(span, 1)
    const s = logistic(-Math.abs(t)) * 2 // peak at mid ≈ 1, tapering to ~0 toward edges
    return clamp01(s)
  }

  // Only end known: score ramps up as we approach the end, then declines after
  if (!start && end) {
    const daysToEnd = (end - now) / (1000 * 60 * 60 * 24)
    const t = -daysToEnd / 30 // 30-day horizon; adjust as needed
    return clamp01(logistic(t))
  }

  // Only start known: slow ramp after start
  if (start && !end) {
    const daysSinceStart = (now - start) / (1000 * 60 * 60 * 24)
    const t = daysSinceStart / 60 // 2-month ramp
    return clamp01(logistic(t) * 0.9)
  }

  return 0
}

export function getDrinkStatus(score: number): DrinkStatus {
  if (score >= 0.8) {return 'at_peak'}
  if (score >= 0.55) {return 'drink_soon'}
  if (score <= 0.15) {return 'too_young'}
  return 'drink_soon'
}

export function fromDrinkingWindow(dw: DrinkingWindow | undefined): { score: number; status: DrinkStatus } {
  if (!dw) {return { score: 0, status: 'too_young' }}
  const score = readinessScore({ start: dw.peakStartDate, end: dw.peakEndDate || dw.latestDate })
  // If latestDate is in the past, mark as over
  if (dw.latestDate && new Date(dw.latestDate).getTime() < Date.now()) {
    return { score: 0, status: 'over' }
  }
  return { score, status: getDrinkStatus(score) }
}

function clamp01(n: number): number {return Math.max(0, Math.min(1, n))}



