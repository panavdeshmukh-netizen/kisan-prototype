import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demoService, type DemoBooking } from '../../lib/demo'
import { formatDate, formatTime } from '../../lib/utils'
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Info,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

const StatusBadge: React.FC<{ status: DemoBooking['status'] }> = ({ status }) => {
  const config = {
    booked: { label: 'Confirmed', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
    completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-gray-50 text-gray-600 border-gray-200' },
  }
  const c = config[status]
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  )
}

export const HomeDashboard: React.FC = () => {
  const { user, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Load demo bookings from localStorage
    const myBookings = demoService.getMyBookings(user.id)
    setBookings(myBookings)
    setLoading(false)
  }, [user])

  // Listen for booking updates (custom event dispatched by BookingFlowPage)
  useEffect(() => {
    const handler = () => {
      if (user) {
        setBookings(demoService.getMyBookings(user.id))
      }
    }
    window.addEventListener('demo:booking-updated', handler)
    return () => window.removeEventListener('demo:booking-updated', handler)
  }, [user])

  const activeBooking = bookings.find((b) => b.status === 'booked')
  const recentBookings = bookings.slice(0, 5)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            <strong>Demo Mode</strong> — Running with local mock data. Backend is offline.
            All bookings are saved to your browser.
          </span>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-4 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-blue-200 text-sm leading-relaxed">
            {activeBooking
              ? 'You have an upcoming appointment. Check your token below.'
              : 'Book your slot at the nearest centre and get your token instantly.'}
          </p>

          <div className="mt-6">
            <Button
              onClick={() => navigate('/book')}
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Book a Slot
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Bookings',
            value: bookings.length,
            icon: Calendar,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Active',
            value: bookings.filter((b) => b.status === 'booked').length,
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'Completed',
            value: bookings.filter((b) => b.status === 'completed').length,
            icon: TrendingUp,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            label: 'Cancelled',
            value: bookings.filter((b) => b.status === 'cancelled').length,
            icon: XCircle,
            color: 'text-red-500 bg-red-50',
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-gray-100">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Booking Card */}
        <div className="lg:col-span-2 space-y-4">
          {activeBooking ? (
            <Card className="border-2 border-blue-100 shadow-lg shadow-blue-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Upcoming Booking
                  </CardTitle>
                  <StatusBadge status={activeBooking.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Token Number — hero display */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-blue-500/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="h-5 w-5 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">
                      Your Token
                    </span>
                  </div>
                  <p className="text-4xl font-black tracking-widest">
                    {activeBooking.tokenNumber}
                  </p>
                  <p className="text-xs text-blue-200 mt-2">Present this at the centre</p>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Centre</p>
                      <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                        {activeBooking.centreName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activeBooking.centreLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {formatDate(activeBooking.slotDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time Slot</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {formatTime(activeBooking.startTime)} – {formatTime(activeBooking.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Empty State */
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="py-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No upcoming bookings
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                  Book a slot at your nearest procurement centre and get your token instantly.
                </p>
                <Button onClick={() => navigate('/book')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Book My First Slot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <button
                onClick={() => navigate('/book')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 group transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Book a Slot</p>
                    <p className="text-xs text-gray-500">Choose centre & time</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">My Bookings</p>
                    <p className="text-xs text-gray-500">View all history</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          {recentBookings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      b.status === 'booked' ? 'bg-emerald-500' :
                      b.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {b.centreName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(b.slotDate, { short: true })} · {formatTime(b.startTime)}
                      </p>
                      <p className="text-xs font-mono text-blue-600 mt-0.5">{b.tokenNumber}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Pro Tip</p>
                  <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                    Book early-morning slots for shorter queues. Your token number is
                    auto-generated — no need to arrive too early!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
