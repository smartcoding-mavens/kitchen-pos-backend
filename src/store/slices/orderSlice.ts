import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { OrderService } from '../../services/orderService'

interface OrderState {
  orders: any[]
  selectedOrder: any | null
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await OrderService.getOrders(restaurantId, filters)
  }
)

export const fetchOrderById = createAsyncThunk(
  'order/fetchById',
  async (orderId: string) => {
    return await OrderService.getOrderById(orderId)
  }
)

export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData: any) => {
    return await OrderService.createOrder(orderData)
  }
)

export const updateOrder = createAsyncThunk(
  'order/update',
  async ({ orderId, updates }: { orderId: string; updates: any }) => {
    return await OrderService.updateOrder(orderId, updates)
  }
)

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ orderId, status }: { orderId: string; status: string }) => {
    return await OrderService.updateOrderStatus(orderId, status as any)
  }
)

export const updateOrderItemStatus = createAsyncThunk(
  'order/updateItemStatus',
  async ({ itemId, status }: { itemId: string; status: string }) => {
    return await OrderService.updateOrderItemStatus(itemId, status)
  }
)

export const fetchOrderStats = createAsyncThunk(
  'order/fetchStats',
  async ({ restaurantId, dateFrom, dateTo }: { restaurantId: string; dateFrom?: string; dateTo?: string }) => {
    return await OrderService.getOrderStats(restaurantId, dateFrom, dateTo)
  }
)

export const generateOrderNumber = createAsyncThunk(
  'order/generateNumber',
  async (restaurantId: string) => {
    return await OrderService.generateOrderNumber(restaurantId)
  }
)

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<any | null>) => {
      state.selectedOrder = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetOrders: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload
        state.loading = false
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch orders'
      })
      // Fetch Order by ID
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload
      })
      // Create Order
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload)
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create order'
      })
      // Update Order
      .addCase(updateOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload
        }
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload
        }
      })
      // Fetch Stats
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setSelectedOrder, clearError, resetOrders } = orderSlice.actions
export default orderSlice.reducer