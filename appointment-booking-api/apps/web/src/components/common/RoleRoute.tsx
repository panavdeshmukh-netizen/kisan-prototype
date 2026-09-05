import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth'
import { LoadingSpinner } from './LoadingSpinner'

export const RoleRoute: React.FC<{
  allowedRole: UserRole
  children: React.ReactNode
}> = ({ allowedRole, children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <LoadingSpinner
        message="Verifying permissions..."
        className="min-h-screen"
      />
    )
  }

  if (!user || user.role !== allowedRole) {
    // Redirect clients to discover and providers to dashboard
    return (
      <Navigate
        to={user?.role === 'provider' ? '/provider/dashboard' : '/discover'}
        replace
      />
    )
  }

  return <>{children}</>
}
