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
      console.log('🔍 Fetching user profile for auth user:', authUser.id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      console.log('📊 Query result - data:', data, 'error:', error)

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('❌ User profile not found for auth user:', authUser.id)
          // Set loading to false even when profile not found
          dispatch(setUser(null))
          return null
        }
        console.error('❌ Error fetching user profile:', error)
        // Set loading to false on error
        dispatch(setUser(null))
        return null
      }

      console.log('✅ User profile fetched successfully:', data.email)
      return data
    } catch (error) {
      console.error('💥 Exception in fetchUserProfile:', error)
      // Set loading to false on exception
      dispatch(setUser(null))
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

      console.log('🔄 handleAuthStateChange called with user:', authUser?.email || 'null')
      
      try {
        if (authUser) {
          console.log('👤 Setting supabase user and fetching profile...')
          setSupabaseUser(authUser)
          const userProfile = await fetchUserProfile(authUser)
          console.log('📋 User profile fetched:', userProfile?.email || 'null')
          if (mounted) {
            dispatch(setUser(userProfile))
            console.log('✅ User profile set in Redux')
          }
        } else {
          console.log('❌ No auth user, clearing state...')
          if (mounted) {
            setSupabaseUser(null)
            dispatch(setUser(null))
            console.log('✅ User cleared in Redux')
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        console.log('💥 Error occurred, clearing state...')
        if (mounted) {
          setSupabaseUser(null)
          dispatch(setUser(null))
          console.log('✅ User cleared due to error')
        }
      }
    }

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth...')
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📋 Session data:', session)
        console.log('❌ Session error:', error)
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            console.log('⚠️ Setting loading to false due to session error')
            dispatch(setLoading(false))
          }
        } else if (session?.user) {
          console.log('✅ Session found, handling auth state change for user:', session.user.email)
          await handleAuthStateChange(session.user)
        } else {
          // No session found, user is not authenticated
          console.log('❌ No session found, setting user to null')
          if (mounted) {
            dispatch(setUser(null))
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        console.log('💥 Exception in initializeAuth, setting user to null')
        if (mounted) {
          dispatch(setUser(null))
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        await handleAuthStateChange(session?.user || null)
      }
    )

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