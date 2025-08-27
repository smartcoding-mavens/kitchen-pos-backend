import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

interface GetMenuRequest {
  restaurant_id: string
  revenue_center_id?: string
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
    const url = new URL(req.url)
    const restaurantId = url.searchParams.get('restaurant_id')
    const revenueCenterId = url.searchParams.get('revenue_center_id')

    if (!restaurantId) {
      return new Response(
        JSON.stringify({ error: 'restaurant_id parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify restaurant exists and is active
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, status')
      .eq('id', restaurantId)
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

    // Get menu categories
    let categoriesQuery = supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)

    if (revenueCenterId) {
      categoriesQuery = categoriesQuery.eq('revenue_center_id', revenueCenterId)
    }

    const { data: categories, error: categoriesError } = await categoriesQuery
      .order('sort_order')

    if (categoriesError) throw categoriesError

    // Get menu items for each category
    const menuData = []

    for (const category of categories || []) {
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_available', true)
        .order('sort_order')

      if (itemsError) throw itemsError

      menuData.push({
        ...category,
        items: items || []
      })
    }

    // Get combo meals
    const { data: comboMeals, error: comboError } = await supabase
      .from('combo_meals')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)

    if (comboError) throw comboError

    // Get active daily deals
    const now = new Date().toISOString()
    const { data: dailyDeals, error: dealsError } = await supabase
      .from('daily_deals')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .lte('valid_from', now)
      .gte('valid_until', now)

    if (dealsError) throw dealsError

    // Get revenue centers
    const { data: revenueCenters, error: centersError } = await supabase
      .from('revenue_centers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('created_at')

    if (centersError) throw centersError

    return new Response(
      JSON.stringify({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name
        },
        revenue_centers: revenueCenters || [],
        categories: menuData,
        combo_meals: comboMeals || [],
        daily_deals: dailyDeals || [],
        last_updated: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Menu fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch menu',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})