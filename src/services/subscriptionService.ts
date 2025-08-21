import { supabase } from '../lib/supabase'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billing_cycle: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export class SubscriptionService {
  static async getPlan(): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plan')
      .select('*')
      .eq('name', 'Basic')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as SubscriptionPlan
  }

  static async updatePlan(updates: Partial<Pick<SubscriptionPlan, 'description' | 'price' | 'currency' | 'is_active'>>): Promise<SubscriptionPlan> {
    // Basic backend-ish validation (DB will enforce too)
    if (updates.price === undefined || updates.price === null || Number.isNaN(Number(updates.price))) {
      throw new Error('Price is required and must be a number')
    }
    const priceNum = Number(updates.price)
    if (priceNum <= 0) {
      throw new Error('Price must be greater than 0')
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(updates.price))) {
      throw new Error('Price can have up to 2 decimal places')
    }

    const { data, error } = await supabase
      .from('subscription_plan')
      .update({
        description: updates.description ?? null,
        price: priceNum,
        currency: updates.currency || 'USD',
        is_active: updates.is_active ?? true,
      })
      .eq('name', 'Basic')
      .select('*')
      .single()

    if (error) throw error
    return data as SubscriptionPlan
  }
} 