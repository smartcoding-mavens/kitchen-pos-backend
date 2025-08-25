import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, Check, ArrowRight, ArrowLeft, Mail, Lock, User, MapPin, Building, CreditCard, DollarSign } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { PaymentIntegrationService } from '../services/paymentIntegrationService'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface RegistrationData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  restaurantName: string
  address: string
}

interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billing_cycle: string
}

interface ValidationErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  restaurantName?: string
  address?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [kitchenOwnerId, setKitchenOwnerId] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    address: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Load subscription plan when component mounts
  React.useEffect(() => {
    const loadPlan = async () => {
      try {
        const subscriptionPlan = await PaymentIntegrationService.getSubscriptionPlan()
        setPlan(subscriptionPlan)
      } catch (error) {
        console.error('Error loading subscription plan:', error)
        toast.error('Failed to load subscription plan')
      }
    }
    loadPlan()
  }, [])

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'Restaurant name is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Restaurant address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Continue = async () => {
    if (!validateStep1()) return

    setLoading(true)
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('kitchen_owners')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        setErrors({ email: 'An account with this email already exists' })
        setLoading(false)
        return
      }

      // Also check in auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const emailExists = authUsers.users.some(user => user.email === formData.email)

      if (emailExists) {
        setErrors({ email: 'An account with this email already exists' })
        setLoading(false)
        return
      }

      setCurrentStep(2)
    } catch (error) {
      console.error('Error checking email:', error)
      toast.error('Failed to validate email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Continue = async () => {
    if (!validateStep2()) return

    setLoading(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'kitchen_owner'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Create kitchen owner record
      const subscriptionExpiresAt = new Date()
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1)

      const { data: kitchenOwner, error: ownerError } = await supabase
        .from('kitchen_owners')
        .insert({
          email: formData.email,
          full_name: formData.fullName,
          subscription_plan: plan?.name || 'basic',
          payment_id: `pending_${Date.now()}`, // Will be updated after payment
          subscription_amount: plan?.price || 99.99,
          subscription_expires_at: subscriptionExpiresAt.toISOString(), // Will be updated after payment
          password_hash: 'managed_by_supabase_auth',
          is_setup_completed: false
        })
        .select()
        .single()

      if (ownerError) throw ownerError

      setKitchenOwnerId(kitchenOwner.id)

      // Create restaurant record
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: kitchenOwner.id,
          name: formData.restaurantName,
          address: formData.address,
          phone_number: 'Not provided',
          domain_name: `${formData.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
          status: 'inactive' // Inactive until approved by super admin
        })

      if (restaurantError) throw restaurantError

      // Create user record for the application
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: 'kitchen_owner',
          restaurant_id: null, // Will be set after approval
          is_active: false // Inactive until approved
        })

      if (userError) {
        console.error('Error creating user record:', userError)
        // Continue anyway as this might be due to RLS policies
      }

      setCurrentStep(3) // Go to payment step
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!plan || !kitchenOwnerId) {
      toast.error('Missing plan or kitchen owner information')
      return
    }

    setProcessingPayment(true)

    try {
      const successUrl = `${window.location.origin}/register?step=4&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${window.location.origin}/register?step=3&cancelled=true`

      const { session_id, url } = await PaymentIntegrationService.processStripeCheckout(
        plan.id,
        plan.price,
        plan.currency,
        kitchenOwnerId,
        formData.restaurantName,
        successUrl,
        cancelUrl
      )

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Payment processing failed. Please try again.')
      setProcessingPayment(false)
    }
  }

  // Check for payment success on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const step = urlParams.get('step')
    const sessionId = urlParams.get('session_id')
    const cancelled = urlParams.get('cancelled')

    if (step === '4' && sessionId) {
      // Payment successful, go to success step
      setCurrentStep(4)
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (step === '3' && cancelled) {
      // Payment cancelled, stay on payment step
      setCurrentStep(3)
      toast.error('Payment was cancelled. Please try again.')
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Step {currentStep} of 4</span>
        <span className="text-sm text-gray-500">
          {currentStep === 1 && 'Account Details'}
          {currentStep === 2 && 'Restaurant Information'}
          {currentStep === 3 && 'Payment'}
          {currentStep === 4 && 'Registration Complete'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Enter your details to get started with Kitchen POS</p>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </div>
        </label>
        <input
          id="fullName"
          type="text"
          className={`input ${errors.fullName ? 'border-red-500' : ''}`}
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </div>
        </label>
        <input
          id="email"
          type="email"
          className={`input ${errors.email ? 'border-red-500' : ''}`}
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </div>
        </label>
        <input
          id="password"
          type="password"
          className={`input ${errors.password ? 'border-red-500' : ''}`}
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Must be 8+ characters with uppercase, lowercase, number, and special character
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Confirm Password
          </div>
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <button
        onClick={handleStep1Continue}
        disabled={loading}
        className="btn-primary btn-lg w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Validating...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Details</h2>
        <p className="text-gray-600">Tell us about your restaurant</p>
      </div>

      <div>
        <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Restaurant Name
          </div>
        </label>
        <input
          id="restaurantName"
          type="text"
          className={`input ${errors.restaurantName ? 'border-red-500' : ''}`}
          placeholder="Enter your restaurant name"
          value={formData.restaurantName}
          onChange={(e) => handleInputChange('restaurantName', e.target.value)}
        />
        {errors.restaurantName && (
          <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Restaurant Address
          </div>
        </label>
        <textarea
          id="address"
          rows={4}
          className={`input resize-none ${errors.address ? 'border-red-500' : ''}`}
          placeholder="Enter your complete restaurant address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Store className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">{plan?.name || 'Basic'} Plan Selected</h4>
            <p className="text-sm text-blue-700">
              Your account will be set up with our {plan?.name || 'Basic'} plan (${plan?.price || 99.99}/{plan?.billing_cycle || 'year'}). 
              Payment will be processed in the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="btn-secondary btn-lg flex-1"
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </div>
        </button>
        <button
          onClick={handleStep2Continue}
          disabled={loading}
          className="btn-primary btn-lg flex-1"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Complete Registration</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
        <p className="text-gray-600">Secure your Kitchen POS subscription</p>
      </div>

      {plan && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name} Plan</h3>
                  <p className="text-sm text-gray-600 capitalize">{plan.billing_cycle} subscription</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-600">per {plan.billing_cycle.replace('ly', '')}</p>
              </div>
            </div>

            {plan.description && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{plan.description}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${plan.price}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">${plan.price} {plan.currency.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-1">Secure Payment</h4>
            <p className="text-sm text-green-700">
              Your payment is processed securely by Stripe. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep(2)}
          className="btn-secondary btn-lg flex-1"
          disabled={processingPayment}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </div>
        </button>
        <button
          onClick={handlePayment}
          disabled={processingPayment || !plan}
          className="btn-primary btn-lg flex-1"
        >
          {processingPayment ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Pay ${plan?.price || 0}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center animate-pulse-soft">
          <Check className="h-10 w-10 text-success-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
        <p className="text-gray-600 mb-4">
          Your payment has been processed successfully and your subscription is now active! 
          Your account will require approval from a Super Admin before you can access the Dashboard.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to <strong>{formData.email}</strong>
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Mail className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-yellow-900 mb-1">Pending Approval</h4>
            <p className="text-sm text-yellow-700">
              Your account is pending approval by a Super Admin. You will be notified via email 
              once your account is approved and you can access your dashboard. Your subscription is already active.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/login')}
          className="btn-primary btn-lg w-full"
        >
          Go to Login Page
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary btn-lg w-full"
        >
          Return to Homepage
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-gray-500">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Join Kitchen POS
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your restaurant with our powerful POS system
          </p>
        </div>

        <div className="card">
          <div className="card-content">
            {renderProgressBar()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </div>

        {currentStep < 4 && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}