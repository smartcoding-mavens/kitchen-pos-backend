import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { 
  fetchBusinessHours, 
  setRevenueCenters, 
  updateBusinessHours, 
  updateLocalBusinessHour,
  clearError
} from '../store/slices/businessHoursSlice'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Clock, Save } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface BusinessHour {
  id?: string
  revenue_center_id: string
  day_of_week: number
  open_time?: string
  close_time?: string
  is_closed: boolean
}

interface RevenueCenter {
  id: string
  name: string
  type: string
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export default function BusinessHours() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { businessHours, revenueCenters, loading, saving, error } = useAppSelector((state) => state.businessHours)

  useEffect(() => {
    if (user?.restaurant_id) {
      fetchData()
    }
  }, [user, dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])
  const fetchData = async () => {
    try {

      // Fetch revenue centers
      const { data: centers, error: centersError } = await supabase
        .from('revenue_centers')
        .select('*')
        .eq('restaurant_id', user?.restaurant_id)
        .eq('is_active', true)

      if (centersError) throw centersError

      dispatch(setRevenueCenters(centers || []))
      dispatch(fetchBusinessHours(user?.restaurant_id!))

    } catch (error) {
      console.error('Error fetching business hours:', error)
      toast.error('Failed to load business hours')
    }
  }

  const updateBusinessHour = (
    centerId: string, 
    dayOfWeek: number, 
    field: keyof BusinessHour, 
    value: any
  ) => {
    dispatch(updateLocalBusinessHour({ centerId, dayOfWeek, field, value }))
  }

  const handleSave = async () => {
    try {

      // Prepare data for upsert
      const hoursToSave = businessHours.map(hour => ({
        ...hour,
        restaurant_id: user?.restaurant_id,
        open_time: hour.is_closed ? null : hour.open_time,
        close_time: hour.is_closed ? null : hour.close_time
      }))

      await dispatch(updateBusinessHours({ restaurantId: user?.restaurant_id!, hoursData: hoursToSave })).unwrap()
      toast.success('Business hours saved successfully')

    } catch (error: any) {
      console.error('Error saving business hours:', error)
    }
  }

  const copyHours = (fromCenterId: string, toCenterId: string) => {
    const fromHours = businessHours.filter(h => h.revenue_center_id === fromCenterId)
    
    fromHours.forEach(fromHour => {
      dispatch(updateLocalBusinessHour({ 
        centerId: toCenterId, 
        dayOfWeek: fromHour.day_of_week, 
        field: 'open_time', 
        value: fromHour.open_time 
      }))
      dispatch(updateLocalBusinessHour({ 
        centerId: toCenterId, 
        dayOfWeek: fromHour.day_of_week, 
        field: 'close_time', 
        value: fromHour.close_time 
      }))
      dispatch(updateLocalBusinessHour({ 
        centerId: toCenterId, 
        dayOfWeek: fromHour.day_of_week, 
        field: 'is_closed', 
        value: fromHour.is_closed 
      }))
    })
    toast.success('Hours copied successfully')
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Hours</h1>
            <p className="text-gray-600">Set operating hours for your restaurant and bar</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary btn-md"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Hours
              </>
            )}
          </button>
        </div>

        {/* Business Hours Grid */}
        {revenueCenters.map((center) => (
          <div key={center.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {center.name} Hours
                  </h3>
                  <span className="badge badge-info capitalize">{center.type}</span>
                </div>
                {revenueCenters.length > 1 && (
                  <select
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    onChange={(e) => {
                      if (e.target.value && e.target.value !== center.id) {
                        copyHours(e.target.value, center.id)
                      }
                    }}
                    value=""
                  >
                    <option value="">Copy hours from...</option>
                    {revenueCenters
                      .filter(c => c.id !== center.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
                )}
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 gap-4">
                {DAYS_OF_WEEK.map((day, dayIndex) => {
                  const hour = businessHours.find(
                    h => h.revenue_center_id === center.id && h.day_of_week === dayIndex
                  )
                  
                  if (!hour) return null

                  return (
                    <div key={dayIndex} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24">
                        <p className="font-medium text-gray-900">{day}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hour.is_closed}
                          onChange={(e) => 
                            updateBusinessHour(center.id, dayIndex, 'is_closed', e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <label className="text-sm text-gray-600">Closed</label>
                      </div>

                      {!hour.is_closed && (
                        <>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Open:</label>
                            <input
                              type="time"
                              value={hour.open_time || '09:00'}
                              onChange={(e) => 
                                updateBusinessHour(center.id, dayIndex, 'open_time', e.target.value)
                              }
                              className="input w-32"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Close:</label>
                            <input
                              type="time"
                              value={hour.close_time || '22:00'}
                              onChange={(e) => 
                                updateBusinessHour(center.id, dayIndex, 'close_time', e.target.value)
                              }
                              className="input w-32"
                            />
                          </div>
                        </>
                      )}

                      {hour.is_closed && (
                        <div className="flex-1">
                          <span className="text-sm text-gray-500 italic">Closed all day</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {revenueCenters.length === 0 && (
          <div className="card">
            <div className="card-content">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No revenue centers found</p>
                <p className="text-sm text-gray-500 mt-1">
                  You need to set up revenue centers first to manage business hours
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}