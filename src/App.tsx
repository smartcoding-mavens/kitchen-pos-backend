import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import MenuManagement from './pages/MenuManagement'
import OrderManagement from './pages/OrderManagement'
import StaffManagement from './pages/StaffManagement'
import CustomerManagement from './pages/CustomerManagement'
import BarcodeManagement from './pages/BarcodeManagement'
import BusinessHours from './pages/BusinessHours'
import ReportsPage from './pages/ReportsPage'
import SubscriptionSettings from './pages/SubscriptionSettings'

function App() {
  const [appLoading, setAppLoading] = React.useState(true)

  React.useEffect(() => {
    // Ensure app is fully loaded before showing content
    const timer = setTimeout(() => {
      setAppLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute requiredRole="kitchen_owner">
                <SetupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager', 'staff']}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/super-admin" 
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/super-admin/subscription" 
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SubscriptionSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/menu" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <MenuManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager', 'staff']}>
                <OrderManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <StaffManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <CustomerManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/barcodes" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <BarcodeManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/business-hours" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <BusinessHours />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredRoles={['kitchen_owner', 'manager']}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </AuthProvider>
  )
}

export default App