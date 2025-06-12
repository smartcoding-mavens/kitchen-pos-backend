import { supabase } from '@/lib/supabase'
import type { Kitchen, MenuItem, Order, Customer, QRCode } from '@/lib/supabase'

// Kitchen API
export const kitchenApi = {
  // Get all kitchens (Super Admin only)
  getAll: async () => {
    const { data, error } = await supabase
      .from('kitchens')
      .select(`
        *,
        profiles:owner_id(full_name, email),
        kitchen_subscriptions(plan, price_per_month, payment_status)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get kitchen by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('kitchens')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Get current user's kitchen
  getMy: async () => {
    const { data, error } = await supabase
      .from('kitchens')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create kitchen
  create: async (kitchen: Partial<Kitchen>) => {
    const { data, error } = await supabase
      .from('kitchens')
      .insert(kitchen)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update kitchen
  update: async (id: string, updates: Partial<Kitchen>) => {
    const { data, error } = await supabase
      .from('kitchens')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update kitchen status (Super Admin only)
  updateStatus: async (id: string, status: Kitchen['status']) => {
    const { data, error } = await supabase
      .from('kitchens')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Menu API
export const menuApi = {
  // Get menu categories
  getCategories: async (kitchenId: string) => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .eq('is_active', true)
      .order('display_order')
    
    if (error) throw error
    return data
  },

  // Get menu items
  getItems: async (kitchenId: string, categoryId?: string) => {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories(name)
      `)
      .eq('kitchen_id', kitchenId)
      .order('display_order')

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Create menu item
  createItem: async (item: Partial<MenuItem>) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update menu item
  updateItem: async (id: string, updates: Partial<MenuItem>) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete menu item
  deleteItem: async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Get combo meals
  getCombos: async (kitchenId: string) => {
    const { data, error } = await supabase
      .from('combo_meals')
      .select(`
        *,
        combo_items(
          quantity,
          menu_items(name, price)
        )
      `)
      .eq('kitchen_id', kitchenId)
      .order('display_order')
    
    if (error) throw error
    return data
  }
}

// Orders API
export const ordersApi = {
  // Get orders
  getAll: async (kitchenId: string, filters?: { status?: string; type?: string }) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_items(name),
          combo_meals(name)
        ),
        customers(name, email, phone)
      `)
      .eq('kitchen_id', kitchenId)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.type) {
      query = query.eq('order_type', filters.type)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Create order
  create: async (order: Partial<Order>, items: any[]) => {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = items.map(item => ({
      ...item,
      order_id: orderData.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return orderData
  },

  // Update order status
  updateStatus: async (id: string, status: Order['status']) => {
    const updates: any = { status }
    
    if (status === 'delivered') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get order analytics
  getAnalytics: async (kitchenId: string, period: string = '30d') => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, status, order_type, created_at')
      .eq('kitchen_id', kitchenId)
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Calculate analytics
    const totalOrders = data.length
    const totalRevenue = data.reduce((sum, order) => sum + order.total_amount, 0)
    const avgOrderValue = totalRevenue / totalOrders || 0

    const statusCounts = data.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const typeCounts = data.reduce((acc, order) => {
      acc[order.order_type] = (acc[order.order_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusCounts,
      typeCounts
    }
  }
}

// Customers API
export const customersApi = {
  // Get customers
  getAll: async (kitchenId: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create customer
  create: async (customer: Partial<Customer>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update customer
  update: async (id: string, updates: Partial<Customer>) => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// QR Codes API
export const qrCodesApi = {
  // Get QR codes
  getAll: async (kitchenId: string) => {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create QR code
  create: async (qrCode: Partial<QRCode>) => {
    const { data, error } = await supabase
      .from('qr_codes')
      .insert(qrCode)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update QR code
  update: async (id: string, updates: Partial<QRCode>) => {
    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Increment scan count
  incrementScan: async (id: string) => {
    const { data, error } = await supabase.rpc('increment_qr_scan', {
      qr_id: id
    })
    
    if (error) throw error
    return data
  }
}

// Revenue API (Super Admin only)
export const revenueApi = {
  // Get platform revenue
  getPlatformRevenue: async (period: string = '30d') => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const { data, error } = await supabase
      .from('revenue_tracking')
      .select(`
        *,
        kitchens(name)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get kitchen revenue
  getKitchenRevenue: async (kitchenId: string, period: string = '30d') => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const { data, error } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

// Notifications API
export const notificationsApi = {
  // Get user notifications
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) throw error
  },

  // Create notification
  create: async (notification: {
    user_id: string
    kitchen_id?: string
    type: string
    title: string
    message: string
    data?: any
  }) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}