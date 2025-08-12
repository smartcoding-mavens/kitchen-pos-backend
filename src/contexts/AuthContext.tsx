import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUser, setLoading, getCurrentUser, signIn as signInAction, signOut as signOutAction } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { user, loading } = useAppSelector((state) => state.auth)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('User profile not found for auth user:', authUser.id)
          return null
        }
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      await dispatch(getCurrentUser())
    } catch (error) {
      console.error('Error refreshing user:', error)
      dispatch(setUser(null))
      setSupabaseUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const handleAuthStateChange = async (authUser: SupabaseUser | null) => {
      if (!mounted) return

      try {
        if (authUser) {
          setSupabaseUser(authUser)
          const userProfile = await fetchUserProfile(authUser)
          if (mounted) {
            dispatch(setUser(userProfile))
          }
        } else {
          if (mounted) {
            setSupabaseUser(null)
            dispatch(setUser(null))
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        if (mounted) {
          setSupabaseUser(null)
          dispatch(setUser(null))
        }
      }
    }

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            dispatch(setLoading(false))
          }
        } else if (session?.user) {
          await handleAuthStateChange(session.user)
        } else {
          // No session found, user is not authenticated
          if (mounted) {
            dispatch(setUser(null))
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          dispatch(setUser(null))
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'INITIAL_SESSION') {
          // Skip initial session as we handle it in initializeAuth
          return
        }

        await handleAuthStateChange(session?.user || null)
      }
    )

    // Initialize auth
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await dispatch(signInAction({ email, password })).unwrap()
      toast.success('Signed in successfully!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    }
  }

  const signOut = async () => {
    try {
      await dispatch(signOutAction()).unwrap()
      setSupabaseUser(null)
      toast.success('Signed out successfully!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}