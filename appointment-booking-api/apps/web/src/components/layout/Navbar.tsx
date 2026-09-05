import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import {
  Calendar,
  LogOut,
  Clock,
  Compass,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { isConnected } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isClient = user?.role === 'client'
  const isProvider = user?.role === 'provider'

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link
            to={isProvider ? '/provider/dashboard' : '/discover'}
            className="flex items-center space-x-2.5 font-bold text-xl tracking-tight text-gray-900"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <span>
              Book<span className="text-blue-600">Ease</span>
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              {isClient && (
                <>
                  <Link
                    to="/discover"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/discover')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Compass className="h-4 w-4" />
                    <span>Find Providers</span>
                  </Link>

                  <Link
                    to="/my-appointments"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/my-appointments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>My Bookings</span>
                  </Link>
                </>
              )}

              {isProvider && (
                <>
                  <Link
                    to="/provider/dashboard"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/provider/dashboard')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/provider/slots"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/provider/slots')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Manage Slots</span>
                  </Link>

                  <Link
                    to="/provider/appointments"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/provider/appointments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Appointments</span>
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Action & User Profile */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <>
              {/* Real-time Socket indicator */}
              <div
                className="hidden sm:flex items-center space-x-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full"
                title={
                  isConnected
                    ? 'Real-time WebSocket connected'
                    : 'Connecting to live updates...'
                }
              >
                {isConnected ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-gray-600">Live</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-400">Offline</span>
                  </>
                )}
              </div>

              {/* Role badge */}
              <Badge
                variant={isProvider ? 'default' : 'secondary'}
                className="capitalize"
              >
                {user.role}
              </Badge>

              {/* Profile Link */}
              <Link
                to="/profile"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline">{user.name}</span>
              </Link>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Logout</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
