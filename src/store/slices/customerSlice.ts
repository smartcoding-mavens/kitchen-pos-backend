import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CustomerService } from '../../services/customerService'

interface CustomerState {
  customers: any[]
  selectedCustomer: any | null
  customerOrders: any[]
  loading: boolean
  loadingOrders: boolean
  error: string | null
  stats: any | null
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  customerOrders: [],
  loading: false,
  loadingOrders: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customer/fetchCustomers',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await CustomerService.getCustomers(restaurantId, filters)
  }
)

export const fetchCustomerById = createAsyncThunk(
  'customer/fetchById',
  async (customerId: string) => {
    return await CustomerService.getCustomerById(customerId)
  }
)

export const fetchCustomerOrders = createAsyncThunk(
  'customer/fetchOrders',
  async (customerId: string) => {
    return await CustomerService.getCustomerOrders(customerId)
  }
)

export const createCustomer = createAsyncThunk(
  'customer/create',
  async (customerData: any) => {
    return await CustomerService.createCustomer(customerData)
  }
)

export const updateCustomer = createAsyncThunk(
  'customer/update',
  async ({ customerId, updates }: { customerId: string; updates: any }) => {
    return await CustomerService.updateCustomer(customerId, updates)
  }
)

export const deleteCustomer = createAsyncThunk(
  'customer/delete',
  async (customerId: string) => {
    await CustomerService.deleteCustomer(customerId)
    return customerId
  }
)

export const fetchCustomerStats = createAsyncThunk(
  'customer/fetchStats',
  async (restaurantId: string) => {
    return await CustomerService.getCustomerStats(restaurantId)
  }
)

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action: PayloadAction<any | null>) => {
      state.selectedCustomer = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetCustomers: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload
        state.loading = false
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch customers'
      })
      // Fetch Customer by ID
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedCustomer = action.payload
      })
      // Fetch Customer Orders
      .addCase(fetchCustomerOrders.pending, (state) => {
        state.loadingOrders = true
      })
      .addCase(fetchCustomerOrders.fulfilled, (state, action) => {
        state.customerOrders = action.payload
        state.loadingOrders = false
      })
      .addCase(fetchCustomerOrders.rejected, (state, action) => {
        state.loadingOrders = false
        state.error = action.error.message || 'Failed to fetch customer orders'
      })
      // Create Customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload)
      })
      // Update Customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(customer => customer.id === action.payload.id)
        if (index !== -1) {
          state.customers[index] = action.payload
        }
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = action.payload
        }
      })
      // Delete Customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(customer => customer.id !== action.payload)
      })
      // Fetch Stats
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setSelectedCustomer, clearError, resetCustomers } = customerSlice.actions
export default customerSlice.reducer