import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billing_cycle: string
  is_active: boolean
}

export interface PaymentData {
  kitchen_owner_id: string
  amount: number
  currency: string
  payment_intent_id: string
  status: 'pending' | 'completed' | 'failed'
  metadata?: any
}

export class PaymentIntegrationService {
  static async getSubscriptionPlan(): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plan')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  static async createPaymentIntent(amount: number, currency: string, metadata: any) {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata
      }
    })

    if (error) throw error
    return data
  }

  static async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId
      }
    })

    if (error) throw error
    return data
  }

  static async recordPayment(paymentData: PaymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: null, // This is for subscription payment, not order
        amount: paymentData.amount,
        method: 'card',
        status: paymentData.status,
        transaction_id: paymentData.payment_intent_id,
        processed_at: paymentData.status === 'completed' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateKitchenOwnerSubscription(
    kitchenOwnerId: string, 
    planId: string, 
    paymentId: string, 
    amount: number,
    billingCycle: string
  ) {
    // Calculate expiry date based on billing cycle
    const expiryDate = new Date()
    if (billingCycle === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    const { data, error } = await supabase
      .from('kitchen_owners')
      .update({
        subscription_plan: planId,
        payment_id: paymentId,
        subscription_amount: amount,
        subscription_expires_at: expiryDate.toISOString()
      })
      .eq('id', kitchenOwnerId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async processStripeCheckout(
    planId: string,
    amount: number,
    currency: string,
    kitchenOwnerId: string,
    restaurantName: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        plan_id: planId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        kitchen_owner_id: kitchenOwnerId,
        restaurant_name: restaurantName,
        success_url: successUrl,
        cancel_url: cancelUrl
      }
    })

    if (error) throw error
    return data
  }
}