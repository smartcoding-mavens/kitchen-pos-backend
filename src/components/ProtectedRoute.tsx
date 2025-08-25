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
    // Get auth user to check email verification
    const checkEmailVerification = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser && !authUser.email_confirmed_at) {
        toast.error('Please verify your email address')
        return <Navigate to="/login" replace />
      }
    }
    checkEmailVerification()
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