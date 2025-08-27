import Stripe from 'npm:stripe@14.10.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
})

interface ConfirmPaymentRequest {
  payment_intent_id: string
  payment_method_id: string
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

    const { payment_intent_id, payment_method_id }: ConfirmPaymentRequest = await req.json()

    if (!payment_intent_id || !payment_method_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_intent_id or payment_method_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: payment_method_id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to confirm payment',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})