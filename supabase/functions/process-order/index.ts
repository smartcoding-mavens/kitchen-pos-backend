import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface OrderItem {
  menu_item_id?: string
  combo_meal_id?: string
  revenue_center_id: string
  quantity: number
  unit_price: number
  customizations?: any
  special_instructions?: string
}

interface ProcessOrderRequest {
  restaurant_id: string
  customer_info?: {
    name?: string
    email?: string
    phone?: string
  }
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  table_number?: string
  delivery_location?: string
  items: OrderItem[]
  notes?: string
  payment_method?: 'cash' | 'card' | 'gift_card' | 'online'
}

async function generateOrderNumber(restaurantId: string): Promise<string> {
  const today = new Date()
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  // Get the count of orders for today
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
    .lt('created_at', `${today.toISOString().slice(0, 10)}T23:59:59.999Z`)

  if (error) throw error

  const orderNumber = `${datePrefix}-${String((count || 0) + 1).padStart(4, '0')}`
  return orderNumber
}

async function findOrCreateCustomer(restaurantId: string, customerInfo?: any) {
  if (!customerInfo || (!customerInfo.email && !customerInfo.phone)) {
    return null
  }

  let customer = null

  // Try to find existing customer by email or phone
  if (customerInfo.email) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('email', customerInfo.email)
      .single()
    
    customer = data
  }

  if (!customer && customerInfo.phone) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', customerInfo.phone)
      .single()
    
    customer = data
  }

  // Create new customer if not found
  if (!customer) {
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      })
      .select()
      .single()

    if (error) throw error
    customer = newCustomer
  }

  return customer
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const orderData: ProcessOrderRequest = await req.json()

    // Validate required fields
    if (!orderData.restaurant_id || !orderData.order_type || !orderData.items || orderData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurant_id, order_type, items' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify restaurant exists and is active
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', orderData.restaurant_id)
      .eq('status', 'active')
      .single()

    if (restaurantError || !restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find or create customer
    const customer = await findOrCreateCustomer(orderData.restaurant_id, orderData.customer_info)

    // Calculate order totals
    let subtotal = 0
    const processedItems = []

    for (const item of orderData.items) {
      const totalPrice = item.unit_price * item.quantity
      subtotal += totalPrice

      processedItems.push({
        ...item,
        total_price: totalPrice
      })
    }

    const taxRate = 0.08 // 8% tax rate (should be configurable per restaurant)
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    // Generate order number
    const orderNumber = await generateOrderNumber(orderData.restaurant_id)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: orderData.restaurant_id,
        customer_id: customer?.id,
        order_number: orderNumber,
        type: orderData.order_type,
        status: 'pending',
        table_number: orderData.table_number,
        delivery_location: orderData.delivery_location,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        notes: orderData.notes
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItemsToInsert = processedItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      combo_meal_id: item.combo_meal_id,
      revenue_center_id: item.revenue_center_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      customizations: item.customizations || {},
      special_instructions: item.special_instructions,
      status: 'pending'
    }))

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)
      .select()

    if (itemsError) throw itemsError

    // Create payment record if payment method is provided
    let payment = null
    if (orderData.payment_method) {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          amount: totalAmount,
          method: orderData.payment_method,
          status: orderData.payment_method === 'cash' ? 'completed' : 'pending',
          processed_at: orderData.payment_method === 'cash' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Error creating payment:', paymentError)
        // Continue without payment record
      } else {
        payment = paymentData
      }
    }

    // Update customer stats if customer exists
    if (customer) {
      await supabase
        .from('customers')
        .update({
          total_orders: customer.total_orders + 1,
          total_spent: Number(customer.total_spent) + totalAmount,
          last_order_at: new Date().toISOString()
        })
        .eq('id', customer.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          type: order.type,
          status: order.status,
          total_amount: order.total_amount,
          created_at: order.created_at
        },
        order_items: orderItems,
        payment: payment,
        customer: customer
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Order processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process order',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})