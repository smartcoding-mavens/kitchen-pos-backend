import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { BusinessHoursService } from '../../services/businessHoursService'

interface BusinessHoursState {
  businessHours: any[]
  revenueCenters: any[]
  loading: boolean
  saving: boolean
  error: string | null
  stats: any | null
}

const initialState: BusinessHoursState = {
  businessHours: [],
  revenueCenters: [],
  loading: false,
  saving: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchBusinessHours = createAsyncThunk(
  'businessHours/fetchHours',
  async (restaurantId: string) => {
    return await BusinessHoursService.getBusinessHours(restaurantId)
  }
)

export const fetchBusinessHoursByRevenueCenter = createAsyncThunk(
  'businessHours/fetchByRevenueCenter',
  async (revenueCenterId: string) => {
    return await BusinessHoursService.getBusinessHoursByRevenueCenter(revenueCenterId)
  }
)

export const createBusinessHours = createAsyncThunk(
  'businessHours/create',
  async (hoursData: any[]) => {
    return await BusinessHoursService.createBusinessHours(hoursData)
  }
)

export const updateBusinessHours = createAsyncThunk(
  'businessHours/update',
  async ({ restaurantId, hoursData }: { restaurantId: string; hoursData: any[] }) => {
    return await BusinessHoursService.updateBusinessHours(restaurantId, hoursData)
  }
)

export const copyHoursToRevenueCenter = createAsyncThunk(
  'businessHours/copyHours',
  async ({ fromCenterId, toCenterId, restaurantId }: { fromCenterId: string; toCenterId: string; restaurantId: string }) => {
    return await BusinessHoursService.copyHoursToRevenueCenter(fromCenterId, toCenterId, restaurantId)
  }
)

export const fetchBusinessHoursStats = createAsyncThunk(
  'businessHours/fetchStats',
  async (restaurantId: string) => {
    return await BusinessHoursService.getBusinessHoursStats(restaurantId)
  }
)

const businessHoursSlice = createSlice({
  name: 'businessHours',
  initialState,
  reducers: {
    setRevenueCenters: (state, action: PayloadAction<any[]>) => {
      state.revenueCenters = action.payload
    },
    updateLocalBusinessHour: (state, action: PayloadAction<{ centerId: string; dayOfWeek: number; field: string; value: any }>) => {
      const { centerId, dayOfWeek, field, value } = action.payload
      const hourIndex = state.businessHours.findIndex(
        h => h.revenue_center_id === centerId && h.day_of_week === dayOfWeek
      )
      if (hourIndex !== -1) {
        state.businessHours[hourIndex] = {
          ...state.businessHours[hourIndex],
          [field]: value
        }
      }
    },
    clearError: (state) => {
      state.error = null
    },
    resetBusinessHours: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Business Hours
      .addCase(fetchBusinessHours.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBusinessHours.fulfilled, (state, action) => {
        state.businessHours = action.payload
        state.loading = false
      })
      .addCase(fetchBusinessHours.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch business hours'
      })
      // Create Business Hours
      .addCase(createBusinessHours.fulfilled, (state, action) => {
        state.businessHours = action.payload
      })
      .addCase(createBusinessHours.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create business hours'
      })
      // Update Business Hours
      .addCase(updateBusinessHours.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateBusinessHours.fulfilled, (state, action) => {
        state.businessHours = action.payload
        state.saving = false
      })
      .addCase(updateBusinessHours.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || 'Failed to update business hours'
      })
      // Copy Hours
      .addCase(copyHoursToRevenueCenter.fulfilled, (state, action) => {
        // Update the business hours with the copied data
        const copiedHours = action.payload
        copiedHours.forEach((hour: any) => {
          const existingIndex = state.businessHours.findIndex(
            h => h.revenue_center_id === hour.revenue_center_id && h.day_of_week === hour.day_of_week
          )
          if (existingIndex !== -1) {
            state.businessHours[existingIndex] = hour
          } else {
            state.businessHours.push(hour)
          }
        })
      })
      // Fetch Stats
      .addCase(fetchBusinessHoursStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setRevenueCenters, updateLocalBusinessHour, clearError, resetBusinessHours } = businessHoursSlice.actions
export default businessHoursSlice.reducer