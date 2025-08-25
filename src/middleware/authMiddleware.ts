import { supabase } from '../lib/supabase'
import { User } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

class AuthMiddleware {
  private static instance: AuthMiddleware
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  }
  private listeners: Array<(state: AuthState) => void> = []

  private constructor() {
    // Delay initialization to avoid hydration issues
    if (typeof window !== 'undefined') {
      setTimeout(() => this.initializeAuth(), 0)
    }
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware()
    }
    return AuthMiddleware.instance
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Set initial loading state
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: true
      })

      // Verify current session with Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        this.clearAuth()
        return
      }

      if (session?.user) {
        // Check email verification first
        if (!session.user.email_confirmed_at) {
          console.log('User email not verified:', session.user.email)
          this.clearAuth()
          return
        }

        // Fetch user profile from database
        const userProfile = await this.fetchUserProfile(session.user.id)
        if (userProfile) {
          // Check account approval status (except for super admin)
          if (userProfile.role !== 'super_admin' && !userProfile.is_active) {
            console.log('User account not approved:', userProfile.email)
            this.clearAuth()
            return
          }

          this.setCachedUser(userProfile)
          this.updateAuthState({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false
          })
        } else {
          this.clearAuth()
        }
      } else {
        this.clearAuth()
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check email verification
          if (!session.user.email_confirmed_at) {
            this.clearAuth()
            return
          }

          const userProfile = await this.fetchUserProfile(session.user.id)
          if (userProfile) {
            // Check account approval status (except for super admin)
            if (userProfile.role !== 'super_admin' && !userProfile.is_active) {
              this.clearAuth()
              return
            }

            this.setCachedUser(userProfile)
            this.updateAuthState({
              user: userProfile,
              isAuthenticated: true,
              isLoading: false
            })
          }
        } else if (event === 'SIGNED_OUT') {
          this.clearAuth()
        }
      })

    } catch (error) {
      console.error('Error initializing auth:', error)
      this.clearAuth()
    }
  }

  private async fetchUserProfile(authUserId: string): Promise<User | null> {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
      
      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }


      return data
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error)
      return null
    }
  }

  private getCachedUser(): User | null {
    try {
      const cachedUser = localStorage.getItem('user')
      return cachedUser ? JSON.parse(cachedUser) : null
    } catch (error) {
      console.error('Error parsing cached user:', error)
      return null
    }
  }

  private setCachedUser(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      console.error('Error caching user:', error)
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('user')
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  private updateAuthState(newState: AuthState): void {
    this.authState = { ...newState }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState))
  }

  // Public methods
  public getAuthState(): AuthState {
    return { ...this.authState }
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public async signIn(email: string, password: string): Promise<void> {
    try {
      // First, get the auth user to check email verification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if email is verified
      if (!authData.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.')
      }

      // Fetch user profile from database
      const userProfile = await this.fetchUserProfile(authData.user.id)
      if (!userProfile) {
        await supabase.auth.signOut()
        throw new Error('User profile not found. Please contact support.')
      }

      // Check account approval status (except for super admin)
      if (userProfile.role !== 'super_admin' && !userProfile.is_active) {
        await supabase.auth.signOut()
        throw new Error('Your account is pending approval by a Super Admin. You will be notified once approved.')
      }

      // All checks passed, set user as authenticated
      this.setCachedUser(userProfile)
      this.updateAuthState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false
      })

    } catch (error) {
      this.clearAuth()
      throw error
    }
  }

  public async signInOld(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const userProfile = await this.fetchUserProfile(data.user.id)
        if (userProfile) {
          this.setCachedUser(userProfile)
          this.updateAuthState({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false
          })
        } else {
          throw new Error('User profile not found')
        }
      }
    } catch (error) {
      this.clearAuth()
      throw error
    }
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } finally {
      this.clearAuth()
    }
  }

  public async refreshUser(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const userProfile = await this.fetchUserProfile(session.user.id)
      if (userProfile) {
        this.setCachedUser(userProfile)
        this.updateAuthState({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false
        })
      }
    }
  }

  // Middleware function for API requests
  public async verifyAuth(): Promise<boolean> {
    if (this.authState.isLoading) {
      // Wait for auth to initialize
      return new Promise((resolve) => {
        const unsubscribe = this.subscribe((state) => {
          if (!state.isLoading) {
            unsubscribe()
            resolve(state.isAuthenticated)
          }
        })
      })
    }
    return this.authState.isAuthenticated
  }

  // Check if user has required role
  public hasRole(requiredRole: string): boolean {
    return this.authState.user?.role === requiredRole
  }

  public hasAnyRole(requiredRoles: string[]): boolean {
    return this.authState.user ? requiredRoles.includes(this.authState.user.role) : false
  }
}

export const authMiddleware = AuthMiddleware.getInstance()
export default authMiddleware