import { supabase } from '../lib/supabase'
import { User } from '../lib/supabase'

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
    this.initializeAuth()
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware()
    }
    return AuthMiddleware.instance
  }

  private async initializeAuth(): Promise<void> {
    try {
      // First check localStorage for cached user
      const cachedUser = this.getCachedUser()
      if (cachedUser) {
        this.updateAuthState({
          user: cachedUser,
          isAuthenticated: true,
          isLoading: false
        })
      }

      // Verify current session with Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        this.clearAuth()
        return
      }

      if (session?.user) {
        // Fetch user profile from database
        const userProfile = await this.fetchUserProfile(session.user.id)
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

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
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
        } else {
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