import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { BarcodeService } from '../../services/barcodeService'

interface BarcodeState {
  barcodes: any[]
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: BarcodeState = {
  barcodes: [],
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchBarcodes = createAsyncThunk(
  'barcode/fetchBarcodes',
  async ({ restaurantId, filters }: { restaurantId: string; filters?: any }) => {
    return await BarcodeService.getBarcodes(restaurantId, filters)
  }
)

export const fetchBarcodeById = createAsyncThunk(
  'barcode/fetchById',
  async (barcodeId: string) => {
    return await BarcodeService.getBarcodeById(barcodeId)
  }
)

export const createBarcode = createAsyncThunk(
  'barcode/create',
  async (barcodeData: any) => {
    return await BarcodeService.createBarcode(barcodeData)
  }
)

export const createMultipleBarcodes = createAsyncThunk(
  'barcode/createMultiple',
  async (barcodesData: any[]) => {
    return await BarcodeService.createMultipleBarcodes(barcodesData)
  }
)

export const updateBarcode = createAsyncThunk(
  'barcode/update',
  async ({ barcodeId, updates }: { barcodeId: string; updates: any }) => {
    return await BarcodeService.updateBarcode(barcodeId, updates)
  }
)

export const toggleBarcodeStatus = createAsyncThunk(
  'barcode/toggleStatus',
  async ({ barcodeId, isActive }: { barcodeId: string; isActive: boolean }) => {
    return await BarcodeService.toggleBarcodeStatus(barcodeId, isActive)
  }
)

export const deleteBarcode = createAsyncThunk(
  'barcode/delete',
  async (barcodeId: string) => {
    await BarcodeService.deleteBarcode(barcodeId)
    return barcodeId
  }
)

export const generateTableBarcodes = createAsyncThunk(
  'barcode/generateTable',
  async ({ restaurantId, quantity }: { restaurantId: string; quantity: number }) => {
    return await BarcodeService.generateTableBarcodes(restaurantId, quantity)
  }
)

export const fetchBarcodeStats = createAsyncThunk(
  'barcode/fetchStats',
  async (restaurantId: string) => {
    return await BarcodeService.getBarcodeStats(restaurantId)
  }
)

const barcodeSlice = createSlice({
  name: 'barcode',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetBarcodes: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Barcodes
      .addCase(fetchBarcodes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBarcodes.fulfilled, (state, action) => {
        state.barcodes = action.payload
        state.loading = false
      })
      .addCase(fetchBarcodes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch barcodes'
      })
      // Create Barcode
      .addCase(createBarcode.fulfilled, (state, action) => {
        state.barcodes.unshift(action.payload)
      })
      .addCase(createBarcode.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create barcode'
      })
      // Create Multiple Barcodes
      .addCase(createMultipleBarcodes.fulfilled, (state, action) => {
        state.barcodes = [...action.payload, ...state.barcodes]
      })
      .addCase(createMultipleBarcodes.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create barcodes'
      })
      // Update Barcode
      .addCase(updateBarcode.fulfilled, (state, action) => {
        const index = state.barcodes.findIndex(barcode => barcode.id === action.payload.id)
        if (index !== -1) {
          state.barcodes[index] = action.payload
        }
      })
      // Toggle Status
      .addCase(toggleBarcodeStatus.fulfilled, (state, action) => {
        const index = state.barcodes.findIndex(barcode => barcode.id === action.payload.id)
        if (index !== -1) {
          state.barcodes[index] = action.payload
        }
      })
      // Delete Barcode
      .addCase(deleteBarcode.fulfilled, (state, action) => {
        state.barcodes = state.barcodes.filter(barcode => barcode.id !== action.payload)
      })
      // Generate Table Barcodes
      .addCase(generateTableBarcodes.fulfilled, (state, action) => {
        state.barcodes = [...action.payload, ...state.barcodes]
      })
      // Fetch Stats
      .addCase(fetchBarcodeStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { clearError, resetBarcodes } = barcodeSlice.actions
export default barcodeSlice.reducer