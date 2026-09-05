import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { RoleRoute } from './components/common/RoleRoute'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Client Pages
import { DiscoverProvidersPage } from './pages/client/DiscoverProvidersPage'
import { ProviderDetailPage } from './pages/client/ProviderDetailPage'
import { MyAppointmentsPage } from './pages/client/MyAppointmentsPage'

// Provider Pages
import { ProviderDashboardPage } from './pages/provider/ProviderDashboardPage'
import { ManageSlotsPage } from './pages/provider/ManageSlotsPage'
import { ProviderAppointmentsPage } from './pages/provider/ProviderAppointmentsPage'

// Shared Pages
import { ProfilePage } from './pages/shared/ProfilePage'
import { NotFoundPage } from './pages/shared/NotFoundPage'

// Index Root Redirect
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to={user.role === 'provider' ? '/provider/dashboard' : '/discover'}
      replace
    />
  )
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main App Layout */}
      <Route path="/" element={<Layout />}>
        {/* Root Auto-Redirect */}
        <Route index element={<RootRedirect />} />

        {/* Client Routes */}
        <Route
          path="discover"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="client">
                <DiscoverProvidersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="providers/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="client">
                <ProviderDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="my-appointments"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="client">
                <MyAppointmentsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Provider Routes */}
        <Route
          path="provider/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="provider">
                <ProviderDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="provider/slots"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="provider">
                <ManageSlotsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="provider/appointments"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRole="provider">
                <ProviderAppointmentsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
