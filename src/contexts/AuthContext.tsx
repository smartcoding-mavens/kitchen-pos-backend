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

      // Just warn if slow, don’t reject
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Supabase query is taking longer than expected...')
      }, 10000)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      clearTimeout(timeoutId)

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        return null
      }

      console.log('✅ User profile fetched successfully:', data?.email)
      return data
    } catch (err) {
      console.error('💥 Exception in fetchUserProfile:', err)
      return null
    }
  }

  const setUserData = (userData: User | null) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
    dispatch(setUser(userData))
  }

  const handleAuthStateChange = async (authUser: SupabaseUser | null) => {
    if (authUser) {
      setSupabaseUser(authUser)

      // Check cache first
      const cachedUser = localStorage.getItem('user')
      if (cachedUser) {
        console.log('📦 Loaded user from localStorage')
        setUserData(JSON.parse(cachedUser))
        dispatch(setLoading(false))
        return
      }

      // No cache → fetch from Supabase
      const userProfile = await fetchUserProfile(authUser)
      setUserData(userProfile)
    } else {
      console.log('❌ No auth user, clearing state...')
      setSupabaseUser(null)
      setUserData(null)
    }

    dispatch(setLoading(false))
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('🔍 Initializing auth...')

      // If cache exists → set immediately
      const cachedUser = localStorage.getItem('user')
      if (cachedUser) {
        console.log('📦 Loaded cached user on init')
        setUserData(JSON.parse(cachedUser))
      }

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Error getting session:', error)
        dispatch(setLoading(false))
        return
      }

      if (session?.user) {
        await handleAuthStateChange(session.user)
      } else {
        if (!cachedUser) setUserData(null)
        dispatch(setLoading(false))
      }
    }

    initializeAuth()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!mounted) return
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
      setUserData(null)
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
    refreshUser: async () => {
      const session = (await supabase.auth.getSession()).data.session
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user)
        setUserData(userProfile)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
