import { useState, useEffect } from 'react'
import authMiddleware from '../middleware/authMiddleware'
import { User } from '../lib/supabase'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState(() => authMiddleware.getAuthState())

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authMiddleware.subscribe((state) => {
      setAuthState(state)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await authMiddleware.signIn(email, password)
  }

  const signOut = async () => {
    await authMiddleware.signOut()
  }

  const refreshUser = async () => {
    await authMiddleware.refreshUser()
  }

  return {
    user: authState.user,
    loading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    signIn,
    signOut,
    refreshUser,
  }
}