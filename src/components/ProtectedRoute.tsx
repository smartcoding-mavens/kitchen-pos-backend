import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authMiddleware from '../middleware/authMiddleware'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredRoles?: string[]
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Add a maximum loading time to prevent infinite loading
  const [maxLoadingReached, setMaxLoadingReached] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setMaxLoadingReached(true)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timer)
  }, [loading])

  // If loading for too long, redirect to login
  if (maxLoadingReached && loading) {
    toast.error('Authentication timeout. Please try logging in again.')
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check email verification for all users except super admin
  if (user.role !== 'super_admin') {
    // Email verification is already checked in auth middleware
    // No need to check again here to avoid async issues
  }

  // Check account approval status (except for super admin)
  if (user.role !== 'super_admin' && !user.is_active) {
    toast.error('Your account is pending approval')
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (requiredRole && !authMiddleware.hasRole(requiredRole)) {
    toast.error('Access Denied')
    return <Navigate to="/dashboard" replace />
  }

  if (requiredRoles && !authMiddleware.hasAnyRole(requiredRoles)) {
    toast.error('Access Denied')
    return <Navigate to="/dashboard" replace />
  }

  // Check if kitchen owner needs to complete setup
  if (user.role === 'kitchen_owner' && !user.restaurant_id && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  // Redirect super admin to their dashboard
  if (user.role === 'super_admin' && location.pathname === '/dashboard') {
    return <Navigate to="/super-admin" replace />
  }

  return <>{children}</>
}