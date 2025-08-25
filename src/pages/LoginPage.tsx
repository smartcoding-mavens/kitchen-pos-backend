import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authMiddleware from '../middleware/authMiddleware'
import { Store, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(formData.email, formData.password)
      toast.success('Signed in successfully!')
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        // Get the current user to determine redirect
        const { user: currentUser } = authMiddleware.getAuthState()
        
        if (currentUser?.role === 'super_admin') {
          navigate('/super-admin', { replace: true })
        } else {
          navigate(from, { replace: true })
        }
      }, 100)
      
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = (error as any).message || 'Failed to sign in'
      
      // Provide more helpful error messages
      if (errorMessage.includes('verify your email')) {
        toast.error('Please verify your email address before signing in. Check your inbox for a verification email.')
      } else if (errorMessage.includes('pending approval')) {
        toast.error('Your account is pending approval by a Super Admin. You will be notified once approved.')
      } else if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Kitchen POS Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your admin panel
          </p>
        </div>

        <div className="card">
          <div className="card-content">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pr-10"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Kitchen POS Admin Panel - Secure Access Only
          </p>
          <p className="text-xs text-gray-500 mt-2">
            New to Kitchen POS?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}