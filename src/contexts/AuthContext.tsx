import React, { createContext, useContext } from 'react'
import { User } from '../lib/supabase'
import { useAuth as useAuthHook } from '../hooks/useAuth'

interface AuthContextType {
  user: User | null
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
  const auth = useAuthHook()

  const value = {
    user: auth.user,
    loading: auth.loading,
    signIn: auth.signIn,
    signOut: auth.signOut,
    refreshUser: auth.refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
