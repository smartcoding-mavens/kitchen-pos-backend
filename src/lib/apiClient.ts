import { supabase } from './supabase'
import authMiddleware from '../middleware/authMiddleware'

// API client wrapper that ensures authentication for all requests
class ApiClient {
  private static instance: ApiClient

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  // Wrapper for Supabase queries that ensures authentication
  public async query<T>(queryFn: () => Promise<T>): Promise<T> {
    const isAuthenticated = await authMiddleware.verifyAuth()
    
    if (!isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      return await queryFn()
    } catch (error) {
      // Handle auth errors specifically
      if (this.isAuthError(error)) {
        // Force re-authentication
        await authMiddleware.signOut()
        throw new Error('Session expired. Please sign in again.')
      }
      throw error
    }
  }

  // Check if error is authentication related
  private isAuthError(error: any): boolean {
    if (!error) return false
    
    const authErrorCodes = [
      'PGRST301', // JWT expired
      'PGRST302', // JWT invalid
      'invalid_token',
      'token_expired',
      'unauthorized'
    ]

    return authErrorCodes.some(code => 
      error.code === code || 
      error.message?.includes(code) ||
      error.message?.toLowerCase().includes('unauthorized') ||
      error.message?.toLowerCase().includes('token')
    )
  }

  // Convenience methods for common operations
  public async select(table: string) {
    return this.query(() => supabase.from(table).select())
  }

  public async insert(table: string, data: any) {
    return this.query(() => supabase.from(table).insert(data))
  }

  public async update(table: string, data: any) {
    return this.query(() => supabase.from(table).update(data))
  }

  public async delete(table: string) {
    return this.query(() => supabase.from(table).delete())
  }

  // Direct access to supabase for complex queries (still authenticated)
  public async withAuth<T>(operation: (supabase: typeof supabase) => Promise<T>): Promise<T> {
    return this.query(() => operation(supabase))
  }
}

export const apiClient = ApiClient.getInstance()
export default apiClient