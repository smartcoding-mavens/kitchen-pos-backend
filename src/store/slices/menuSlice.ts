import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { MenuService } from '../../services/menuService'

interface MenuState {
  categories: any[]
  menuItems: any[]
  comboMeals: any[]
  dailyDeals: any[]
  revenueCenters: any[]
  loading: boolean
  error: string | null
  stats: any | null
}

const initialState: MenuState = {
  categories: [],
  menuItems: [],
  comboMeals: [],
  dailyDeals: [],
  revenueCenters: [],
  loading: false,
  error: null,
  stats: null,
}

// Async thunks
export const fetchMenuCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (restaurantId: string) => {
    return await MenuService.getMenuCategories(restaurantId)
  }
)

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchItems',
  async (restaurantId: string) => {
    return await MenuService.getMenuItems(restaurantId)
  }
)

export const fetchComboMeals = createAsyncThunk(
  'menu/fetchComboMeals',
  async (restaurantId: string) => {
    return await MenuService.getComboMeals(restaurantId)
  }
)

export const fetchDailyDeals = createAsyncThunk(
  'menu/fetchDailyDeals',
  async (restaurantId: string) => {
    return await MenuService.getDailyDeals(restaurantId)
  }
)

export const createMenuCategory = createAsyncThunk(
  'menu/createCategory',
  async (categoryData: any) => {
    return await MenuService.createMenuCategory(categoryData)
  }
)

export const updateMenuCategory = createAsyncThunk(
  'menu/updateCategory',
  async ({ id, updates }: { id: string; updates: any }) => {
    return await MenuService.updateMenuCategory(id, updates)
  }
)

export const deleteMenuCategory = createAsyncThunk(
  'menu/deleteCategory',
  async (id: string) => {
    await MenuService.deleteMenuCategory(id)
    return id
  }
)

export const createMenuItem = createAsyncThunk(
  'menu/createItem',
  async (itemData: any) => {
    return await MenuService.createMenuItem(itemData)
  }
)

export const updateMenuItem = createAsyncThunk(
  'menu/updateItem',
  async ({ id, updates }: { id: string; updates: any }) => {
    return await MenuService.updateMenuItem(id, updates)
  }
)

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteItem',
  async (id: string) => {
    await MenuService.deleteMenuItem(id)
    return id
  }
)

export const fetchMenuStats = createAsyncThunk(
  'menu/fetchStats',
  async (restaurantId: string) => {
    return await MenuService.getMenuStats(restaurantId)
  }
)

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setRevenueCenters: (state, action: PayloadAction<any[]>) => {
      state.revenueCenters = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetMenu: (state) => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchMenuCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMenuCategories.fulfilled, (state, action) => {
        state.categories = action.payload
        state.loading = false
      })
      .addCase(fetchMenuCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch categories'
      })
      // Fetch Items
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.menuItems = action.payload
        state.loading = false
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch menu items'
      })
      // Create Category
      .addCase(createMenuCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload)
      })
      .addCase(createMenuCategory.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create category'
      })
      // Update Category
      .addCase(updateMenuCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat.id === action.payload.id)
        if (index !== -1) {
          state.categories[index] = action.payload
        }
      })
      // Delete Category
      .addCase(deleteMenuCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(cat => cat.id !== action.payload)
      })
      // Create Item
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.menuItems.push(action.payload)
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create menu item'
      })
      // Update Item
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.menuItems.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.menuItems[index] = action.payload
        }
      })
      // Delete Item
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.menuItems = state.menuItems.filter(item => item.id !== action.payload)
      })
      // Fetch Stats
      .addCase(fetchMenuStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setRevenueCenters, clearError, resetMenu } = menuSlice.actions
export default menuSlice.reducer