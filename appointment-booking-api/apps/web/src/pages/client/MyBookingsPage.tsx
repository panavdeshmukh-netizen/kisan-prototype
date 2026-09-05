import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demoService, type DemoBooking } from '../../lib/demo'
import { formatDate, formatTime } from '../../lib/utils'
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Plus,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

type FilterStatus = 'all' | 'booked' | 'completed' | 'cancelled'

const STATUS_CONFIG = {
  booked: {
    label: 'Confirmed',
    icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    badge: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-400',
  },
}

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    setBookings(demoService.getMyBookings(user.id))
    setLoading(false)
  }, [user])

  useEffect(() => {
    const handler = () => {
      if (user) setBookings(demoService.getMyBookings(user.id))
    }
    window.addEventListener('demo:booking-updated', handler)
    return () => window.removeEventListener('demo:booking-updated', handler)
  }, [user])

  const handleCancel = (bookingId: number) => {
    if (!user) return
    setCancellingId(bookingId)
    setTimeout(() => {
      demoService.cancelBooking(bookingId, user.id)
      setBookings(demoService.getMyBookings(user.id))
      window.dispatchEvent(new Event('demo:booking-updated'))
      setCancellingId(null)
    }, 600)
  }

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/book')}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {(['all', 'booked', 'completed', 'cancelled'] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all'
              ? `All (${bookings.length})`
              : `${f === 'booked' ? 'Confirmed' : f === 'completed' ? 'Completed' : 'Cancelled'} (${bookings.filter((b) => b.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No bookings found</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            {filter === 'all' ? 'Start by booking your first slot.' : `No ${filter} bookings.`}
          </p>
          <Button onClick={() => navigate('/book')}>Book a Slot</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const config = STATUS_CONFIG[booking.status]
            const Icon = config.icon
            const isActive = booking.status === 'booked'

            return (
              <Card
                key={booking.id}
                className={`overflow-hidden transition-all ${
                  isActive ? 'border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Token Badge */}
                    <div className="flex-shrink-0">
                      <div className={`inline-flex flex-col items-center justify-center w-20 h-20 rounded-2xl shadow-sm ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Ticket className="h-5 w-5 mb-1 opacity-70" />
                        <p className="text-xs font-black leading-tight text-center px-1">
                          {booking.tokenNumber.replace('TKN-', '')}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-sm">{booking.centreName}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.badge}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          <span className="truncate">{booking.centreLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          {formatDate(booking.slotDate, { short: true })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                        </div>
                      </div>

                      <p className="text-xs font-mono text-blue-600 mt-2 font-bold">
                        Token: {booking.tokenNumber}
                      </p>
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          isLoading={cancellingId === booking.id}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
