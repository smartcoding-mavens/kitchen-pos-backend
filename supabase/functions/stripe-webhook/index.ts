import Stripe from 'npm:stripe@14.10.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { kitchen_owner_id, plan_id, restaurant_name } = session.metadata || {}

        if (!kitchen_owner_id || !plan_id) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Record payment
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            order_id: null,
            amount: session.amount_total / 100, // Convert from cents
            method: 'card',
            status: 'completed',
            transaction_id: session.payment_intent,
            processed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (paymentError) {
          console.error('Error recording payment:', paymentError)
          break
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from('subscription_plan')
          .select('*')
          .eq('id', plan_id)
          .single()

        if (planError) {
          console.error('Error fetching plan:', planError)
          break
        }

        // Calculate expiry date
        const expiryDate = new Date()
        if (plan.billing_cycle === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1)
        } else {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1)
        }

        // Update kitchen owner
        const { error: updateError } = await supabase
          .from('kitchen_owners')
          .update({
            subscription_plan: plan.name,
            payment_id: payment.id,
            subscription_amount: session.amount_total / 100,
            subscription_expires_at: expiryDate.toISOString()
          })
          .eq('id', kitchen_owner_id)

        if (updateError) {
          console.error('Error updating kitchen owner:', updateError)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler failed',
        details: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})