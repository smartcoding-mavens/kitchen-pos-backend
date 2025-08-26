import { supabase } from '../lib/supabase'

export interface GolfClub {
  id: string
  kitchen_owner_id: string
  name: string
  description?: string
  address: string
  email: string
  phone_number: string
  city: string
  state: string
  country: string
  zipcode: number
  status: 'active' | 'inactive'
  location?: string
  created_at: string
  updated_at: string
}

export interface CreateGolfClubData {
  kitchen_owner_id: string
  name: string
  description?: string
  address: string
  email: string
  phone_number: string
  city: string
  state: string
  country?: string
  zipcode: number
  status?: 'active' | 'inactive'
  location?: string
}

export interface GolfClubFilters {
  status?: 'active' | 'inactive'
  search?: string
}

export class GolfClubService {
  static async getGolfClubs(kitchenOwnerId: string, filters?: GolfClubFilters) {
    let query = supabase
      .from('golf_clubs')
      .select('*')
      .eq('kitchen_owner_id', kitchenOwnerId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getGolfClubById(id: string) {
    const { data, error } = await supabase
      .from('golf_clubs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createGolfClub(golfClubData: CreateGolfClubData) {
    const { data, error } = await supabase
      .from('golf_clubs')
      .insert({
        ...golfClubData,
        country: golfClubData.country || 'United States',
        status: golfClubData.status || 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateGolfClub(id: string, updates: Partial<CreateGolfClubData>) {
    const { data, error } = await supabase
      .from('golf_clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateGolfClubStatus(id: string, status: 'active' | 'inactive') {
    return this.updateGolfClub(id, { status })
  }

  static async deleteGolfClub(id: string) {
    const { error } = await supabase
      .from('golf_clubs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getGolfClubStats(kitchenOwnerId: string) {
    const { data, error } = await supabase
      .from('golf_clubs')
      .select('status, created_at')
      .eq('kitchen_owner_id', kitchenOwnerId)

    if (error) throw error

    const total = data?.length || 0
    const active = data?.filter(club => club.status === 'active').length || 0
    const inactive = data?.filter(club => club.status === 'inactive').length || 0

    return {
      total,
      active,
      inactive,
      statusDistribution: { active, inactive }
    }
  }

  static async validateGolfClubData(data: Partial<CreateGolfClubData>): Promise<{ [key: string]: string }> {
    const errors: { [key: string]: string } = {}

    if (!data.name?.trim()) {
      errors.name = 'Golf club name is required'
    }

    if (!data.address?.trim()) {
      errors.address = 'Address is required'
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!data.phone_number?.trim()) {
      errors.phone_number = 'Phone number is required'
    }

    if (!data.city?.trim()) {
      errors.city = 'City is required'
    }

    if (!data.state?.trim()) {
      errors.state = 'State is required'
    }

    if (!data.zipcode || data.zipcode <= 0) {
      errors.zipcode = 'Valid zipcode is required'
    }

    return errors
  }
}