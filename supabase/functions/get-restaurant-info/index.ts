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
    const restaurantId = url.searchParams.get('restaurant_id')
    const domainName = url.searchParams.get('domain_name')

    if (!restaurantId && !domainName) {
      return new Response(
        JSON.stringify({ error: 'Either restaurant_id or domain_name parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build query based on provided parameter
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        address,
        phone_number,
        domain_name,
        status,
        revenue_centers (
          id,
          name,
          type,
          is_active
        )
      `)
      .eq('status', 'active')

    if (restaurantId) {
      query = query.eq('id', restaurantId)
    } else if (domainName) {
      query = query.eq('domain_name', domainName)
    }

    const { data: restaurant, error: restaurantError } = await query.single()

    if (restaurantError || !restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get business hours for today
    const today = new Date()
    const dayOfWeek = today.getDay()
    const currentTime = today.toTimeString().slice(0, 5) // HH:MM format

    const { data: businessHours, error: hoursError } = await supabase
      .from('business_hours')
      .select(`
        *,
        revenue_centers (name, type)
      `)
      .eq('restaurant_id', restaurant.id)
      .eq('day_of_week', dayOfWeek)

    if (hoursError) {
      console.error('Error fetching business hours:', hoursError)
      // Continue without business hours data
    }

    // Determine if restaurant is currently open
    let isOpen = true
    let openRevenueCenters: string[] = []

    if (businessHours) {
      businessHours.forEach(hour => {
        let centerOpen = true
        
        if (hour.is_closed) {
          centerOpen = false
        } else if (hour.open_time && hour.close_time) {
          // Handle overnight hours (e.g., 22:00 to 02:00)
          if (hour.close_time < hour.open_time) {
            centerOpen = currentTime >= hour.open_time || currentTime <= hour.close_time
          } else {
            centerOpen = currentTime >= hour.open_time && currentTime <= hour.close_time
          }
        }

        if (centerOpen) {
          openRevenueCenters.push(hour.revenue_centers.name)
        }
      })

      // Restaurant is open if at least one revenue center is open
      isOpen = openRevenueCenters.length > 0
    }

    return new Response(
      JSON.stringify({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          phone_number: restaurant.phone_number,
          domain_name: restaurant.domain_name,
          status: restaurant.status
        },
        revenue_centers: restaurant.revenue_centers?.filter(rc => rc.is_active) || [],
        business_status: {
          is_open: isOpen,
          open_centers: openRevenueCenters,
          current_time: currentTime,
          day_of_week: dayOfWeek
        },
        last_updated: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Restaurant info fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch restaurant information',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})