import { corsHeaders } from '../_shared/cors.ts'

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')

interface CreateCheckoutSessionRequest {
  plan_id: string
  amount: number
  currency: string
  kitchen_owner_id: string
  restaurant_name: string
  success_url: string
  cancel_url: string
}

Deno.serve(async (req: Request) => {
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

    const {
      plan_id,
      amount,
      currency,
      kitchen_owner_id,
      restaurant_name,
      success_url,
      cancel_url
    }: CreateCheckoutSessionRequest = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Kitchen POS Subscription',
              description: `Subscription for ${restaurant_name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        kitchen_owner_id,
        plan_id,
        restaurant_name,
      },
    })

    return new Response(
      JSON.stringify({
        session_id: session.id,
        url: session.url
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})