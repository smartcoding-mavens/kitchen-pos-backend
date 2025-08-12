import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../../lib/supabase'
import { AuthService } from '../../services/authService'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
}

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const data = await AuthService.signIn(email, password)
    return data
  }
)

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await AuthService.signOut()
})

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const user = await AuthService.getCurrentUser()
  return user
})

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    const user = await AuthService.updateUserProfile(userId, updates)
    return user
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetAuth: (state) => {
      state.user = null
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Sign in failed'
      })
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.loading = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.loading = false
        state.error = null
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Sign out failed'
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.user = null
        state.loading = false
        state.error = action.error.message || 'Failed to get user'
      })
      // Update User Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
        state.error = null
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update profile'
      })
  },
})

export const { setUser, setLoading, clearError, resetAuth } = authSlice.actions
export default authSlice.reducer