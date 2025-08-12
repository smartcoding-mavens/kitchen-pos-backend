import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import restaurantSlice from './slices/restaurantSlice'
import menuSlice from './slices/menuSlice'
import orderSlice from './slices/orderSlice'
import staffSlice from './slices/staffSlice'
import customerSlice from './slices/customerSlice'
import barcodeSlice from './slices/barcodeSlice'
import businessHoursSlice from './slices/businessHoursSlice'
import reportSlice from './slices/reportSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    restaurant: restaurantSlice,
    menu: menuSlice,
    order: orderSlice,
    staff: staffSlice,
    customer: customerSlice,
    barcode: barcodeSlice,
    businessHours: businessHoursSlice,
    report: reportSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch