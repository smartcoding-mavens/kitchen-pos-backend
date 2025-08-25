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
  private initialized = false
  private initPromise: Promise<void> | null = null

  private constructor() {
    // Initialize immediately but safely
    this.initializeAuth()
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware()
    }
    return AuthMiddleware.instance
  }

  private async initializeAuth(): Promise<void> {
    // Prevent multiple initializations
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.performInitialization()
    return this.initPromise
  }

  private async performInitialization(): Promise<void> {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        this.clearAuth()
        return
      }

      // Set loading state immediately
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: true
      })

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

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

        // Fetch user profile with timeout
        const userProfile = await this.fetchUserProfileWithTimeout(session.user.id)
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

      // Set up auth state change listener only once
      if (!this.initialized) {
        this.setupAuthListener()
        this.initialized = true
      }

    } catch (error) {
      console.error('Error initializing auth:', error)
      this.clearAuth()
    }
  }

  private setupAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check email verification
          if (!session.user.email_confirmed_at) {
            this.clearAuth()
            return
          }

          const userProfile = await this.fetchUserProfileWithTimeout(session.user.id)
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
          } else {
            this.clearAuth()
          }
        } else if (event === 'SIGNED_OUT') {
          this.clearAuth()
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        this.clearAuth()
      }
    })
  }

  private async fetchUserProfileWithTimeout(authUserId: string): Promise<User | null> {
    try {
      const profilePromise = this.fetchUserProfile(authUserId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )

      return await Promise.race([profilePromise, timeoutPromise]) as User | null
    } catch (error) {
      console.error('Error fetching user profile with timeout:', error)
      return null
    }
  }

  private async fetchUserProfile(authUserId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

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
      if (typeof window === 'undefined') return null
      const cachedUser = localStorage.getItem('user')
      return cachedUser ? JSON.parse(cachedUser) : null
    } catch (error) {
      console.error('Error parsing cached user:', error)
      return null
    }
  }

  private setCachedUser(user: User): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch (error) {
      console.error('Error caching user:', error)
    }
  }

  private clearAuth(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('Error clearing auth cache:', error)
    }
    
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
    // Use setTimeout to prevent synchronous state updates that can cause issues
    setTimeout(() => {
      this.listeners.forEach(listener => {
        try {
          listener(this.authState)
        } catch (error) {
          console.error('Error in auth listener:', error)
        }
      })
    }, 0)
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
      // Set loading state
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: true
      })

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
      const userProfile = await this.fetchUserProfileWithTimeout(authData.user.id)
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

  public async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } finally {
      this.clearAuth()
    }
  }

  public async refreshUser(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userProfile = await this.fetchUserProfileWithTimeout(session.user.id)
        if (userProfile) {
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
    } catch (error) {
      console.error('Error refreshing user:', error)
      this.clearAuth()
    }
  }

  // Middleware function for API requests
  public async verifyAuth(): Promise<boolean> {
    if (this.authState.isLoading) {
      // Wait for auth to initialize with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        const unsubscribe = this.subscribe((state) => {
          if (!state.isLoading) {
            clearTimeout(timeout)
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