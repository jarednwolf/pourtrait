import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AI engine to avoid network and heavy logic
vi.mock('@/lib/ai/recommendation-engine', () => ({
  AIRecommendationEngine: class {
    async generateRecommendations() {
      return {
        recommendations: [
          { type: 'inventory', wineId: 'w1', reasoning: 'Fits your preferences', confidence: 0.9 },
          { type: 'purchase', suggestedWine: { name: 'Nice Wine', producer: 'A' }, reasoning: 'Explore new region', confidence: 0.8 },
        ],
        reasoning: 'Based on your profile and context',
        confidence: 0.85,
        educationalNotes: 'Note about styles',
        followUpQuestions: ['What will you eat?'],
        responseMetadata: { model: 'gpt-4', tokensUsed: 123, responseTime: 45, validationPassed: true, validationErrors: [], confidence: 0.85 }
      }
    }
  }
}))

// Supabase RLS helpers mock
const makeSupabase = () => {
  const supabase: any = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'wines') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [
            { id: 'w1', name: 'Wine One', producer: 'P', vintage: 2020, type: 'red', region: 'Napa', quantity: 1, drinkingWindow: { currentStatus: 'ready', latestDate: new Date().toISOString(), peakEndDate: new Date().toISOString() } },
          ] })
        }
      }
      if (table === 'palate_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: {
            user_id: 'u1',
            sweetness: 0.3,
            acidity: 0.6,
            tannin: 0.5,
            body: 0.5,
            flavor_maps: {
              red: { fruitRipeness: 0.6, oak: 0.3, preferredRegions: ['Napa'], preferredVarietals: ['Cabernet Sauvignon'] },
              white: { fruitRipeness: 0.4 },
              sparkling: { fruitRipeness: 0.4 }
            },
            budget_tier: 'weekend',
            confidence_score: 0.8,
            updated_at: new Date().toISOString()
          } })
        }
      }
      if (table === 'ai_interactions') {
        return { insert: vi.fn().mockResolvedValue({}) }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
    })
  }
  return supabase
}

let supabaseMock: any
vi.mock('@/lib/supabase/api-auth', () => ({
  getAccessTokenFromRequest: () => 'token',
  createRlsClientFromRequest: () => supabaseMock
}))

// Import after mocks
// eslint-disable-next-line import/first
import { POST, GET } from '@/app/api/ai/recommendations/route'

describe('AI Recommendations API (edge) - E2E-ish', () => {
  beforeEach(() => {
    supabaseMock = makeSupabase()
  })

  it('returns 401 when missing Authorization header', async () => {
    const req = new Request('https://example.com/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What should I drink?', includeInventory: false })
    })
    // Bypass our mock token by temporarily overriding helper
    const mod = await import('@/lib/supabase/api-auth')
    vi.spyOn(mod, 'getAccessTokenFromRequest').mockReturnValueOnce(null as any)
    const res: any = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('generates recommendations with inventory and logs interaction', async () => {
    const headers = new Headers()
    headers.set('authorization', 'Bearer token')
    headers.set('content-type', 'application/json')
    const req = new Request('https://example.com/api/ai/recommendations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'Dinner wine', includeInventory: true, context: { occasion: 'dinner' } })
    })
    const res: any = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.recommendations)).toBe(true)
  })

  it('GET health returns healthy', async () => {
    const res: any = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('healthy')
  })
})


