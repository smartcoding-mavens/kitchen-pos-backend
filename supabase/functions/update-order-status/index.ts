import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface UpdateOrderStatusRequest {
  order_id: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  item_id?: string
  notes?: string
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

    const { order_id, status, item_id, notes }: UpdateOrderStatusRequest = await req.json()

    if (!order_id || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, status' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (item_id) {
      // Update specific order item status
      const { data: updatedItem, error: itemError } = await supabase
        .from('order_items')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', item_id)
        .eq('order_id', order_id)
        .select()
        .single()

      if (itemError) throw itemError

      // Check if all items are ready/served to update order status
      const { data: allItems, error: allItemsError } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', order_id)

      if (allItemsError) throw allItemsError

      // Auto-update order status based on item statuses
      let newOrderStatus = order.status
      if (allItems.every(item => ['ready', 'served'].includes(item.status))) {
        newOrderStatus = 'ready'
      } else if (allItems.some(item => item.status === 'preparing')) {
        newOrderStatus = 'preparing'
      }

      if (newOrderStatus !== order.status) {
        await supabase
          .from('orders')
          .update({ 
            status: newOrderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          updated_item: updatedItem,
          order_status: newOrderStatus
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Update entire order status
      const updateData: any = { 
        status: status,
        updated_at: new Date().toISOString()
      }

      if (notes) {
        updateData.notes = notes
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order_id)
        .select()
        .single()

      if (updateError) throw updateError

      // Also update all order items to match the order status
      await supabase
        .from('order_items')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', order_id)

      return new Response(
        JSON.stringify({
          success: true,
          order: updatedOrder
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('Order status update error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update order status',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})