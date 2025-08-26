import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { GolfClubService, GolfClub, CreateGolfClubData, GolfClubFilters } from '../../services/golfClubService'

interface GolfClubState {
  golfClubs: GolfClub[]
  selectedGolfClub: GolfClub | null
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: GolfClubState = {
  golfClubs: [],
  selectedGolfClub: null,
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchGolfClubs = createAsyncThunk(
  'golfClub/fetchGolfClubs',
  async ({ kitchenOwnerId, filters }: { kitchenOwnerId: string; filters?: GolfClubFilters }) => {
    return await GolfClubService.getGolfClubs(kitchenOwnerId, filters)
  }
)

export const fetchGolfClubById = createAsyncThunk(
  'golfClub/fetchById',
  async (id: string) => {
    return await GolfClubService.getGolfClubById(id)
  }
)

export const createGolfClub = createAsyncThunk(
  'golfClub/create',
  async (golfClubData: CreateGolfClubData) => {
    return await GolfClubService.createGolfClub(golfClubData)
  }
)

export const updateGolfClub = createAsyncThunk(
  'golfClub/update',
  async ({ id, updates }: { id: string; updates: Partial<CreateGolfClubData> }) => {
    return await GolfClubService.updateGolfClub(id, updates)
  }
)

export const updateGolfClubStatus = createAsyncThunk(
  'golfClub/updateStatus',
  async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
    return await GolfClubService.updateGolfClubStatus(id, status)
  }
)

export const deleteGolfClub = createAsyncThunk(
  'golfClub/delete',
  async (id: string) => {
    await GolfClubService.deleteGolfClub(id)
    return id
  }
)

export const fetchGolfClubStats = createAsyncThunk(
  'golfClub/fetchStats',
  async (kitchenOwnerId: string) => {
    return await GolfClubService.getGolfClubStats(kitchenOwnerId)
  }
)

const golfClubSlice = createSlice({
  name: 'golfClub',
  initialState,
  reducers: {
    setSelectedGolfClub: (state, action: PayloadAction<GolfClub | null>) => {
      state.selectedGolfClub = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetGolfClubs: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Golf Clubs
      .addCase(fetchGolfClubs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGolfClubs.fulfilled, (state, action) => {
        state.golfClubs = action.payload
        state.loading = false
      })
      .addCase(fetchGolfClubs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch golf clubs'
      })
      // Fetch Golf Club by ID
      .addCase(fetchGolfClubById.fulfilled, (state, action) => {
        state.selectedGolfClub = action.payload
      })
      // Create Golf Club
      .addCase(createGolfClub.fulfilled, (state, action) => {
        state.golfClubs.unshift(action.payload)
      })
      .addCase(createGolfClub.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create golf club'
      })
      // Update Golf Club
      .addCase(updateGolfClub.fulfilled, (state, action) => {
        const index = state.golfClubs.findIndex(club => club.id === action.payload.id)
        if (index !== -1) {
          state.golfClubs[index] = action.payload
        }
        if (state.selectedGolfClub?.id === action.payload.id) {
          state.selectedGolfClub = action.payload
        }
      })
      // Update Golf Club Status
      .addCase(updateGolfClubStatus.fulfilled, (state, action) => {
        const index = state.golfClubs.findIndex(club => club.id === action.payload.id)
        if (index !== -1) {
          state.golfClubs[index] = action.payload
        }
        if (state.selectedGolfClub?.id === action.payload.id) {
          state.selectedGolfClub = action.payload
        }
      })
      // Delete Golf Club
      .addCase(deleteGolfClub.fulfilled, (state, action) => {
        state.golfClubs = state.golfClubs.filter(club => club.id !== action.payload)
        if (state.selectedGolfClub?.id === action.payload) {
          state.selectedGolfClub = null
        }
      })
      // Fetch Stats
      .addCase(fetchGolfClubStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setSelectedGolfClub, clearError, resetGolfClubs } = golfClubSlice.actions
export default golfClubSlice.reducer