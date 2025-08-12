import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReportService } from '../../services/reportService'

interface ReportState {
  salesReport: any | null
  revenueTrends: any | null
  customerInsights: any | null
  menuPerformance: any | null
  dashboardStats: any | null
  loading: boolean
  error: string | null
}

const initialState: ReportState = {
  salesReport: null,
  revenueTrends: null,
  customerInsights: null,
  menuPerformance: null,
  dashboardStats: null,
  loading: false,
  error: null,
}

// Async thunks
export const generateSalesReport = createAsyncThunk(
  'report/generateSales',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await ReportService.generateSalesReport(restaurantId, filters)
  }
)

export const fetchRevenueTrends = createAsyncThunk(
  'report/fetchRevenueTrends',
  async ({ restaurantId, days }: { restaurantId: string; days?: number }) => {
    return await ReportService.getRevenueTrends(restaurantId, days)
  }
)

export const fetchCustomerInsights = createAsyncThunk(
  'report/fetchCustomerInsights',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await ReportService.getCustomerInsights(restaurantId, filters)
  }
)

export const fetchMenuPerformance = createAsyncThunk(
  'report/fetchMenuPerformance',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await ReportService.getMenuPerformance(restaurantId, filters)
  }
)

export const fetchDashboardStats = createAsyncThunk(
  'report/fetchDashboardStats',
  async (restaurantId: string) => {
    return await ReportService.getDashboardStats(restaurantId)
  }
)

export const exportReport = createAsyncThunk(
  'report/export',
  async ({ restaurantId, reportType, filters }: { restaurantId: string; reportType: string; filters?: any }) => {
    return await ReportService.exportReport(restaurantId, reportType, filters)
  }
)

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetReports: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Sales Report
      .addCase(generateSalesReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateSalesReport.fulfilled, (state, action) => {
        state.salesReport = action.payload
        state.loading = false
      })
      .addCase(generateSalesReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to generate sales report'
      })
      // Fetch Revenue Trends
      .addCase(fetchRevenueTrends.fulfilled, (state, action) => {
        state.revenueTrends = action.payload
      })
      .addCase(fetchRevenueTrends.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch revenue trends'
      })
      // Fetch Customer Insights
      .addCase(fetchCustomerInsights.fulfilled, (state, action) => {
        state.customerInsights = action.payload
      })
      .addCase(fetchCustomerInsights.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch customer insights'
      })
      // Fetch Menu Performance
      .addCase(fetchMenuPerformance.fulfilled, (state, action) => {
        state.menuPerformance = action.payload
      })
      .addCase(fetchMenuPerformance.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch menu performance'
      })
      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch dashboard stats'
      })
  },
})

export const { clearError, resetReports } = reportSlice.actions
export default reportSlice.reducer