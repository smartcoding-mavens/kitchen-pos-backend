import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  error: string | null
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
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setError('Failed to fetch user profile')
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError('Failed to fetch user profile')
      return null
    }
  }

  const refreshUser = async () => {
    try {
      setError(null)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Error getting auth user:', authError)
        setError('Authentication error')
        setUser(null)
        setSupabaseUser(null)
        return
      }
      
      if (authUser) {
        const userProfile = await fetchUserProfile(authUser)
        setUser(userProfile)
        setSupabaseUser(authUser)
      } else {
        setUser(null)
        setSupabaseUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setError('Failed to refresh user session')
      setUser(null)
      setSupabaseUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setError(null)
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setError('Failed to get session')
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (session?.user && mounted) {
          setSupabaseUser(session.user)
          const userProfile = await fetchUserProfile(session.user)
          if (mounted) {
            setUser(userProfile)
          }
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setError('Failed to initialize authentication')
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        try {
          setError(null)
          
          if (event === 'SIGNED_OUT' || !session?.user) {
            setSupabaseUser(null)
            setUser(null)
          } else if (session?.user) {
            setSupabaseUser(session.user)
            const userProfile = await fetchUserProfile(session.user)
            setUser(userProfile)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
          setError('Authentication state change error')
        }
        
        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast.success('Signed in successfully!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'Failed to sign in')
      toast.error(error.message || 'Failed to sign in')
      throw error
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSupabaseUser(null)
      toast.success('Signed out successfully!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError(error.message || 'Failed to sign out')
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    error,
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