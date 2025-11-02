import { describe, it, expect } from 'vitest'
import { getAccessTokenFromRequest } from '@/lib/supabase/api-auth'

function makeReq(headers: Record<string, string>) {
  return { headers: new Map(Object.entries(headers)) } as any
}

describe('api-auth helpers', () => {
  it('extracts bearer token case-insensitively', () => {
    const req1 = makeReq({ authorization: 'Bearer abc' })
    const req2 = makeReq({ Authorization: 'Bearer def' })
    expect(getAccessTokenFromRequest(req1)).toBe('abc')
    expect(getAccessTokenFromRequest(req2)).toBe('def')
  })

  it('returns null without header', () => {
    const req = makeReq({})
    expect(getAccessTokenFromRequest(req)).toBeNull()
  })
})


