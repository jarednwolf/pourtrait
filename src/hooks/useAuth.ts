import { useAuthContext } from '@/components/providers/AuthProvider'
import type { UseAuthReturn } from './useAuthInternal'

export type { UseAuthReturn }

export function useAuth(): UseAuthReturn {
  return useAuthContext()
}

export function useIsAuthenticated(): boolean {
  const { user, initialized } = useAuth()
  return initialized && user !== null
}

export function useUserProfile() {
  const { user, loading } = useAuth()
  return { profile: user?.profile || null, loading, isAuthenticated: !!user }
}

export function useAuthLoading(): boolean {
  const { loading, initialized } = useAuth()
  return loading || !initialized
}


