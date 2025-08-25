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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    // Set mounted flag
    setMounted(true)
    
    // Get initial auth state
    const initialState = authMiddleware.getAuthState()
    if (isMounted) {
      setAuthState(initialState)
    }
    
    // Subscribe to auth state changes
    const unsubscribe = authMiddleware.subscribe((state) => {
      if (isMounted) {
        setAuthState(state)
      }
    })

    // Cleanup function
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Return loading state until component is mounted to prevent hydration issues
  if (!mounted) {
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      signIn: async () => {},
      signOut: async () => {},
      refreshUser: async () => {},
    }
  }

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