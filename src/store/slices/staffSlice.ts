import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { StaffService } from '../../services/staffService'

interface StaffState {
  staff: any[]
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: StaffState = {
  staff: [],
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async (restaurantId: string) => {
    return await StaffService.getStaffByRestaurant(restaurantId)
  }
)

export const fetchStaffById = createAsyncThunk(
  'staff/fetchById',
  async (staffId: string) => {
    return await StaffService.getStaffById(staffId)
  }
)

export const createStaff = createAsyncThunk(
  'staff/create',
  async (staffData: any) => {
    return await StaffService.createStaff(staffData)
  }
)

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ staffId, updates }: { staffId: string; updates: any }) => {
    return await StaffService.updateStaff(staffId, updates)
  }
)

export const updateStaffStatus = createAsyncThunk(
  'staff/updateStatus',
  async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
    return await StaffService.updateStaffStatus(staffId, isActive)
  }
)

export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async (staffId: string) => {
    await StaffService.deleteStaff(staffId)
    return staffId
  }
)

export const assignStaffToRevenueCenters = createAsyncThunk(
  'staff/assignToRevenueCenters',
  async ({ staffId, revenueCenterIds }: { staffId: string; revenueCenterIds: string[] }) => {
    return await StaffService.assignStaffToRevenueCenters(staffId, revenueCenterIds)
  }
)

export const fetchStaffStats = createAsyncThunk(
  'staff/fetchStats',
  async (restaurantId: string) => {
    return await StaffService.getStaffStats(restaurantId)
  }
)

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetStaff: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Staff
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.staff = action.payload
        state.loading = false
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch staff'
      })
      // Create Staff
      .addCase(createStaff.fulfilled, (state, action) => {
        state.staff.push(action.payload.user)
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create staff member'
      })
      // Update Staff
      .addCase(updateStaff.fulfilled, (state, action) => {
        const index = state.staff.findIndex(member => member.id === action.payload.id)
        if (index !== -1) {
          state.staff[index] = action.payload
        }
      })
      // Update Staff Status
      .addCase(updateStaffStatus.fulfilled, (state, action) => {
        const index = state.staff.findIndex(member => member.id === action.payload.id)
        if (index !== -1) {
          state.staff[index] = action.payload
        }
      })
      // Delete Staff
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.staff = state.staff.filter(member => member.id !== action.payload)
      })
      // Fetch Stats
      .addCase(fetchStaffStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { clearError, resetStaff } = staffSlice.actions
export default staffSlice.reducer