import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RestaurantService } from '../../services/restaurantService'
import { RevenueCenterService } from '../../services/revenueCenterService'

interface RestaurantState {
  restaurants: any[]
  currentRestaurant: any | null
  revenueCenters: any[]
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: RestaurantState = {
  restaurants: [],
  currentRestaurant: null,
  revenueCenters: [],
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchAllRestaurants = createAsyncThunk(
  'restaurant/fetchAll',
  async () => {
    return await RestaurantService.getAllRestaurants()
  }
)

export const fetchRestaurantById = createAsyncThunk(
  'restaurant/fetchById',
  async (id: string) => {
    return await RestaurantService.getRestaurantById(id)
  }
)

export const createRestaurant = createAsyncThunk(
  'restaurant/create',
  async (restaurantData: any) => {
    return await RestaurantService.createRestaurant(restaurantData)
  }
)

export const updateRestaurant = createAsyncThunk(
  'restaurant/update',
  async ({ id, updates }: { id: string; updates: any }) => {
    return await RestaurantService.updateRestaurant(id, updates)
  }
)

export const updateRestaurantStatus = createAsyncThunk(
  'restaurant/updateStatus',
  async ({ id, status }: { id: string; status: string }) => {
    return await RestaurantService.updateRestaurantStatus(id, status as any)
  }
)

export const fetchRevenueCenters = createAsyncThunk(
  'restaurant/fetchRevenueCenters',
  async (restaurantId: string) => {
    return await RevenueCenterService.getRevenueCentersByRestaurant(restaurantId)
  }
)

export const createRevenueCenter = createAsyncThunk(
  'restaurant/createRevenueCenter',
  async (centerData: any) => {
    return await RevenueCenterService.createRevenueCenter(centerData)
  }
)

export const updateRevenueCenter = createAsyncThunk(
  'restaurant/updateRevenueCenter',
  async ({ id, updates }: { id: string; updates: any }) => {
    return await RevenueCenterService.updateRevenueCenter(id, updates)
  }
)

export const deleteRevenueCenter = createAsyncThunk(
  'restaurant/deleteRevenueCenter',
  async (id: string) => {
    await RevenueCenterService.deleteRevenueCenter(id)
    return id
  }
)

export const fetchRestaurantStats = createAsyncThunk(
  'restaurant/fetchStats',
  async () => {
    return await RestaurantService.getRestaurantStats()
  }
)

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setCurrentRestaurant: (state, action: PayloadAction<any | null>) => {
      state.currentRestaurant = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetRestaurant: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Restaurants
      .addCase(fetchAllRestaurants.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllRestaurants.fulfilled, (state, action) => {
        state.restaurants = action.payload
        state.loading = false
      })
      .addCase(fetchAllRestaurants.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch restaurants'
      })
      // Fetch Restaurant by ID
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.currentRestaurant = action.payload
      })
      // Create Restaurant
      .addCase(createRestaurant.fulfilled, (state, action) => {
        state.restaurants.unshift(action.payload)
        state.currentRestaurant = action.payload
      })
      .addCase(createRestaurant.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create restaurant'
      })
      // Update Restaurant
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        const index = state.restaurants.findIndex(restaurant => restaurant.id === action.payload.id)
        if (index !== -1) {
          state.restaurants[index] = action.payload
        }
        if (state.currentRestaurant?.id === action.payload.id) {
          state.currentRestaurant = action.payload
        }
      })
      // Update Restaurant Status
      .addCase(updateRestaurantStatus.fulfilled, (state, action) => {
        const index = state.restaurants.findIndex(restaurant => restaurant.id === action.payload.id)
        if (index !== -1) {
          state.restaurants[index] = action.payload
        }
        if (state.currentRestaurant?.id === action.payload.id) {
          state.currentRestaurant = action.payload
        }
      })
      // Fetch Revenue Centers
      .addCase(fetchRevenueCenters.fulfilled, (state, action) => {
        state.revenueCenters = action.payload
      })
      // Create Revenue Center
      .addCase(createRevenueCenter.fulfilled, (state, action) => {
        state.revenueCenters.push(action.payload)
      })
      // Update Revenue Center
      .addCase(updateRevenueCenter.fulfilled, (state, action) => {
        const index = state.revenueCenters.findIndex(center => center.id === action.payload.id)
        if (index !== -1) {
          state.revenueCenters[index] = action.payload
        }
      })
      // Delete Revenue Center
      .addCase(deleteRevenueCenter.fulfilled, (state, action) => {
        state.revenueCenters = state.revenueCenters.filter(center => center.id !== action.payload)
      })
      // Fetch Stats
      .addCase(fetchRestaurantStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setCurrentRestaurant, clearError, resetRestaurant } = restaurantSlice.actions
export default restaurantSlice.reducer