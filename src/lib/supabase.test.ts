import { describe, it, expect, beforeEach } from 'vitest'
import { supabase } from './supabase'

describe('Supabase Client', () => {
  beforeEach(() => {
    // Reset any auth state before each test
    supabase.auth.signOut()
  })

  it('should create a supabase client instance', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should have auth methods available', () => {
    expect(typeof supabase.auth.signUp).toBe('function')
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
  })

  it('should have database methods available', () => {
    expect(typeof supabase.from).toBe('function')
  })
})