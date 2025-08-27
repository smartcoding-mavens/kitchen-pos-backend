import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('order_id')
    const orderNumber = url.searchParams.get('order_number')

    if (!orderId && !orderNumber) {
      return new Response(
        JSON.stringify({ error: 'Either order_id or order_number parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build query based on provided parameter
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        type,
        status,
        table_number,
        delivery_location,
        total_amount,
        notes,
        created_at,
        updated_at,
        restaurants (
          name,
          phone_number
        ),
        customers (
          name,
          phone
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          status,
          special_instructions,
          menu_items (
            name,
            description,
            preparation_time
          ),
          combo_meals (
            name,
            description
          ),
          revenue_centers (
            name,
            type
          )
        ),
        payments (
          status,
          method,
          amount,
          processed_at
        )
      `)

    if (orderId) {
      query = query.eq('id', orderId)
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber)
    }

    const { data: order, error: orderError } = await query.single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate estimated completion time based on preparation times
    let estimatedCompletionTime = null
    if (order.status === 'preparing') {
      const maxPrepTime = Math.max(
        ...order.order_items.map((item: any) => 
          item.menu_items?.preparation_time || item.combo_meals?.preparation_time || 15
        )
      )
      
      const orderTime = new Date(order.created_at)
      estimatedCompletionTime = new Date(orderTime.getTime() + maxPrepTime * 60000).toISOString()
    }

    // Calculate payment status
    const payments = order.payments || []
    let paymentStatus = 'pending'
    
    if (payments.length > 0) {
      const totalPaid = payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      
      if (totalPaid >= order.total_amount) {
        paymentStatus = 'completed'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }
    }

    return new Response(
      JSON.stringify({
        order: {
          id: order.id,
          order_number: order.order_number,
          type: order.type,
          status: order.status,
          table_number: order.table_number,
          delivery_location: order.delivery_location,
          total_amount: order.total_amount,
          notes: order.notes,
          created_at: order.created_at,
          updated_at: order.updated_at,
          estimated_completion_time: estimatedCompletionTime
        },
        restaurant: order.restaurants,
        customer: order.customers,
        items: order.order_items.map((item: any) => ({
          id: item.id,
          name: item.menu_items?.name || item.combo_meals?.name,
          description: item.menu_items?.description || item.combo_meals?.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          status: item.status,
          special_instructions: item.special_instructions,
          revenue_center: item.revenue_centers
        })),
        payment_status: paymentStatus,
        payments: payments.map((payment: any) => ({
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          processed_at: payment.processed_at
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Order status fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch order status',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})