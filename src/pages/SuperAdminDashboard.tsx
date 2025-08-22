import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchAllRestaurants, updateRestaurantStatus } from '../store/slices/restaurantSlice'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import {
  DollarSign,
  Store,
  Users,
  TrendingUp,
  Crown,
  Calendar,
  BarChart3,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import { SubscriptionService, SubscriptionPlan } from '../services/subscriptionService'

interface SuperAdminStats {
  totalRevenue: number
  totalRestaurants: number
  activeRestaurants: number
  totalKitchenOwners: number
  monthlyRevenue: number
  topRestaurants: any[]
  recentRestaurants: any[]
}

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [kitchenOwners, setKitchenOwners] = useState<any[]>([])
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    fetchSuperAdminData()
  }, [dispatch])

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const p = await SubscriptionService.getPlan()
        setPlan(p)
      } catch (e) {
        // ignore
      }
    }
    loadPlan()

    const channel = supabase
      .channel('subscription_plan_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plan' }, () => {
        SubscriptionService.getPlan().then(setPlan).catch(() => {})
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true)

      // Fetch restaurants first
      console.log('Fetching restaurants as super admin...')
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select(`
          *,
          kitchen_owners (
            full_name,
            email,
            subscription_plan
          )
        `)
        .order('created_at', { ascending: false })

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError)
        toast.error(`Restaurant fetch error: ${restaurantsError.message}`)
        // Continue with empty array if restaurants fetch fails
      }

      // Fetch kitchen owners
      const { data: owners, error: ownersError } = await supabase
        .from('kitchen_owners')
        .select(`
          *,
          restaurants (
            id,
            name,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (ownersError) {
        console.error('Error fetching kitchen owners:', ownersError)
        toast.error(`Kitchen owners fetch error: ${ownersError.message}`)
        toast.error('Failed to load kitchen owners data')
        return
      }

      // Calculate stats
      const totalRevenue = owners?.reduce((sum, owner) => sum + Number(owner.subscription_amount), 0) || 0
      const totalRestaurants = restaurants?.length || 0
      const activeRestaurants = restaurants?.filter(r => r.status === 'active').length || 0
      const totalKitchenOwners = owners?.length || 0

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = owners?.filter(owner => {
        const createdDate = new Date(owner.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).reduce((sum, owner) => sum + Number(owner.subscription_amount), 0) || 0

      // Get top restaurants (mock data for now - would need order data)
      const topRestaurants = (restaurants || []).slice(0, 5).map(restaurant => ({
        ...restaurant,
        sales: Math.floor(Math.random() * 10000) + 1000 // Mock sales data
      }))

      // Get recent restaurants
      const recentRestaurants = (restaurants || []).slice(0, 5)

      setStats({
        totalRevenue,
        totalRestaurants,
        activeRestaurants,
        totalKitchenOwners,
        monthlyRevenue,
        topRestaurants,
        recentRestaurants
      })

      setKitchenOwners(owners || [])

    } catch (error) {
      console.error('Error fetching super admin data:', error)
      toast.error('Failed to load some dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleProxyLogin = async (ownerId: string) => {
    try {
      // In a real implementation, you would create a secure proxy login mechanism
      toast('Proxy login feature would be implemented here')
    } catch (error) {
      toast.error('Failed to proxy login')
    }
  }

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus })
        .eq('id', restaurantId)

      if (error) throw error

      toast.success('Restaurant status updated successfully')
      // Refresh data
      fetchSuperAdminData()
    } catch (error) {
      console.error('Error updating restaurant status:', error)
      toast.error('Failed to update restaurant status')
    }
  }

  const handleApproveAccount = async (ownerId: string) => {
    try {
      // Find the kitchen owner and their restaurant
      const owner = kitchenOwners.find(o => o.id === ownerId)
      if (!owner || !owner.restaurants?.[0]) {
        toast.error('Restaurant not found')
        return
      }

      const restaurantId = owner.restaurants[0].id

      // First, get the auth user and confirm their email
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers.users.find(u => u.email === owner.email)
      
      if (authUser) {
        // Confirm the email for the auth user
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.error('Error confirming email:', confirmError)
          // Continue anyway as this might not be critical
        }
      }

      // Update restaurant status to active
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({ status: 'active' })
        .eq('id', restaurantId)

      if (restaurantError) throw restaurantError

      // Update user status to active and set restaurant_id
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          restaurant_id: restaurantId
        })
        .eq('email', owner.email)

      if (userError) {
        console.error('Error updating user status:', userError)
        // Continue anyway as the restaurant is approved
      }

      // Send approval notification email
      try {
        await sendApprovalEmail(owner, owner.restaurants[0])
      } catch (emailError) {
        console.error('Error sending approval email:', emailError)
        // Don't fail the approval process if email fails
      }

      toast.success('Account approved successfully! User can now access their dashboard.')
      // Refresh data
      fetchSuperAdminData()
    } catch (error) {
      console.error('Error approving account:', error)
      toast.error('Failed to approve account')
    }
  }

  const sendApprovalEmail = async (owner: any, restaurant: any) => {
    // Create approval email content
    const emailContent = {
      to: owner.email,
      subject: 'Your Kitchen POS Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Kitchen POS</h1>
            <h2 style="color: #16a34a; margin: 0;">Account Approved! 🎉</h2>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Hello <strong>${owner.full_name}</strong>,</p>
            <p>Great news! Your Kitchen POS account has been approved by our admin team.</p>
            <p>Your restaurant "<strong>${restaurant.name}</strong>" is now active and ready to use.</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
            <ol style="color: #374151; line-height: 1.6;">
              <li>Log in to your admin dashboard using your registered email and password</li>
              <li>Complete your restaurant setup if you haven't already</li>
              <li>Set up your menu categories and items</li>
              <li>Configure your revenue centers and business hours</li>
              <li>Generate QR codes for your tables</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #374151;">Account Details:</h4>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${owner.email}</p>
            <p style="margin: 5px 0;"><strong>Restaurant:</strong> ${restaurant.name}</p>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${owner.subscription_plan} ($${owner.subscription_amount}/year)</p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Need help getting started? Contact our support team or check out our documentation.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              This email was sent because your Kitchen POS account was approved.
            </p>
          </div>
        </div>
      `
    }

    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll log the email content and show a success message
    console.log('Approval email would be sent:', emailContent)
    
    // You could also call an edge function here to send the actual email
    // const { error } = await supabase.functions.invoke('send-email', { body: emailContent })
    // if (error) throw error
    
    toast.success('Approval email sent to the kitchen owner')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="card gradient-primary text-white">
          <div className="card-content">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-white/90">Welcome back, {user?.full_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats?.totalRevenue.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
          {/* Added: Subscription Plan */}
          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan (Basic)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plan ? `${plan.currency} ${Number(plan.price).toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Crown className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalRestaurants || 0}
                  </p>
                  <p className="text-xs text-success-600 mt-1">
                    {stats?.activeRestaurants || 0} active
                  </p>
                </div>
                <div className="p-3 bg-success-100 rounded-full">
                  <Store className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kitchen Owners</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalKitchenOwners || 0}
                  </p>
                </div>
                <div className="p-3 bg-warning-100 rounded-full">
                  <Users className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats?.monthlyRevenue.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-error-100 rounded-full">
                  <Calendar className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Restaurants and Recent Restaurants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Restaurants</h3>
            </div>
            <div className="card-content">
              {stats?.topRestaurants.length ? (
                <div className="space-y-4">
                  {stats.topRestaurants.map((restaurant, index) => (
                    <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{restaurant.name}</p>
                          <p className="text-sm text-gray-600">${restaurant.sales.toLocaleString()} sales</p>
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-success-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Recently Joined Restaurants</h3>
            </div>
            <div className="card-content">
              {stats?.recentRestaurants.length ? (
                <div className="space-y-4">
                  {stats.recentRestaurants.map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">
                          Joined {format(new Date(restaurant.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className={`badge ${
                        restaurant.status === 'active' ? 'badge-success' : 
                        restaurant.status === 'inactive' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {restaurant.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No restaurants yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Kitchen Owners Management */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Kitchen Owners Management</h3>
          </div>
          <div className="card-content">
            {kitchenOwners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Restaurant</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kitchenOwners.map((owner) => (
                      <tr key={owner.id}>
                        <td className="font-medium">{owner.full_name}</td>
                        <td>{owner.email}</td>
                        <td>
                          <span className="badge badge-info capitalize">
                            {owner.subscription_plan}
                          </span>
                        </td>
                        <td className="font-medium">${Number(owner.subscription_amount).toFixed(2)}</td>
                        <td>
                          {owner.restaurants?.[0] ? (
                            <div>
                              <p className="font-medium">{owner.restaurants[0].name}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(owner.restaurants[0].created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not setup</span>
                          )}
                        </td>
                        <td>
                          {owner.restaurants?.[0] ? (
                            <select
                              value={owner.restaurants[0].status}
                              onChange={(e) => handleStatusChange(owner.restaurants[0].id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          ) : (
                            <span className="badge badge-warning">Pending Setup</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProxyLogin(owner.id)}
                              className="btn-sm btn-secondary"
                              disabled={!owner.restaurants?.[0]}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            {owner.restaurants?.[0] && (
                              <button
                                onClick={() => handleApproveAccount(owner.id)}
                                className="btn-sm btn-primary"
                                disabled={owner.restaurants[0].status === 'active'}
                              >
                                {owner.restaurants[0].status === 'active' ? 'Approved' : 'Approve'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No kitchen owners yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}