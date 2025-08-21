import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { SubscriptionService, SubscriptionPlan } from '../services/subscriptionService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function SubscriptionSettings() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<{ price?: string }>({})

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const p = await SubscriptionService.getPlan()
        if (p) {
          setPlan(p)
          setDescription(p.description || '')
          setPrice(String(p.price))
          setCurrency(p.currency || 'USD')
          setIsActive(!!p.is_active)
        }
      } catch (e: any) {
        toast.error(e.message || 'Failed to load subscription plan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const validate = useMemo(() => (value: string) => {
    if (!value || value.trim() === '') return 'Price is required'
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return 'Enter a valid price (max 2 decimals)'
    if (Number(value) <= 0) return 'Price must be greater than 0'
    return undefined
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceError = validate(price)
    if (priceError) {
      setErrors({ price: priceError })
      return
    }

    try {
      setSaving(true)
      const updated = await SubscriptionService.updatePlan({
        description: description || undefined,
        price: Number(price),
        currency: currency || 'USD',
        is_active: isActive,
      })
      setPlan(updated)
      toast.success('Subscription plan updated')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update plan')
    } finally {
      setSaving(false)
    }
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
        <div className="card">
          <div className="card-content">
            <h2 className="text-xl font-semibold mb-1">Subscription Plan</h2>
            <p className="text-gray-500 mb-4">Manage the single Basic plan</p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value="Basic"
                  disabled
                  className="input w-full bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full min-h-[80px]"
                  placeholder="Starter plan with essential features"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value)
                      if (errors.price) setErrors({ ...errors, price: undefined })
                    }}
                    className={`input w-full ${errors.price ? 'border-red-500' : ''}`}
                    placeholder="99.99"
                  />
                  {errors.price && (
                    <p className="text-xs text-red-600 mt-1">{errors.price}</p>
                  )}
                </div>
                
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>

             

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
} 