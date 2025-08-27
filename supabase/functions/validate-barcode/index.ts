import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ValidateBarcodeRequest {
  code: string
  restaurant_id?: string
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

    const { code, restaurant_id }: ValidateBarcodeRequest = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find barcode
    const { data: barcode, error: barcodeError } = await supabase
      .from('barcodes')
      .select(`
        *,
        restaurants (
          id,
          name,
          status,
          domain_name
        )
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (barcodeError || !barcode) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Invalid or inactive barcode' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if restaurant is active
    if (barcode.restaurants.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Restaurant is not currently active' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If restaurant_id is provided, verify it matches
    if (restaurant_id && barcode.restaurant_id !== restaurant_id) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Barcode does not belong to the specified restaurant' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if restaurant is currently open (optional enhancement)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    const { data: businessHours } = await supabase
      .from('business_hours')
      .select('open_time, close_time, is_closed')
      .eq('restaurant_id', barcode.restaurant_id)
      .eq('day_of_week', dayOfWeek)

    let isOpen = true
    if (businessHours && businessHours.length > 0) {
      const hours = businessHours[0]
      if (hours.is_closed) {
        isOpen = false
      } else if (hours.open_time && hours.close_time) {
        // Handle overnight hours (e.g., 22:00 to 02:00)
        if (hours.close_time < hours.open_time) {
          isOpen = currentTime >= hours.open_time || currentTime <= hours.close_time
        } else {
          isOpen = currentTime >= hours.open_time && currentTime <= hours.close_time
        }
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        barcode: {
          id: barcode.id,
          code: barcode.code,
          type: barcode.type,
          identifier: barcode.identifier,
          restaurant_id: barcode.restaurant_id
        },
        restaurant: {
          id: barcode.restaurants.id,
          name: barcode.restaurants.name,
          domain_name: barcode.restaurants.domain_name,
          status: barcode.restaurants.status
        },
        is_open: isOpen,
        message: isOpen ? 'Restaurant is open' : 'Restaurant is currently closed'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Barcode validation error:', error)
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})