"use client"
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from './BottomNav'

export function AuthBottomNav() {
  const { user, initialized, loading } = useAuth()
  if (!initialized || loading || !user) { return null }
  return <BottomNav />
}


