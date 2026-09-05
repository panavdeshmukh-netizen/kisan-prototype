import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTimeRange } from '../../lib/utils'
import {
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export const ProviderDashboardPage: React.FC = () => {
  const { user } = useAuth()

  // Fetch appointments for this provider
  const { data: appointmentsData, isLoading: isApptsLoading } = useQuery({
    queryKey: ['appointments', 'provider'],
    queryFn: () => api.appointments.getMyAppointments(),
  })

  // Fetch provider slots
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['slots', 'my-slots'],
    queryFn: () => api.slots.getMySlots(),
  })

  const appointments = appointmentsData?.data || []
  const slots = slotsData?.data || []

  const bookedCount = appointments.filter((a) => a.status === 'booked').length
  const completedCount = appointments.filter(
    (a) => a.status === 'completed',
  ).length
  const totalSlotsCount = slots.length
  const availableSlotsCount = slots.filter((s) => !s.is_booked).length

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'booked')
    .slice(0, 5)

  if (isApptsLoading || isSlotsLoading) {
    return (
      <LoadingSpinner
        message="Loading your dashboard..."
        className="min-h-[50vh]"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-white/20 text-white border-0">
            Provider Portal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Manage your schedule, define availability slots, and track client
            appointments with real-time updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/provider/slots">
            <Button className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow-md">
              <PlusCircle className="mr-2 h-4 w-4 text-blue-600" /> Add Time
              Slots
            </Button>
          </Link>
          <Link to="/provider/appointments">
            <Button
              variant="outline"
              className="text-white border-white/30 bg-white/10 hover:bg-white/20"
            >
              View All Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Upcoming Bookings
              </span>
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {bookedCount}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Confirmed client appointments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Completed
              </span>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {completedCount}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Successfully finished sessions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Available Slots
              </span>
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {availableSlotsCount}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Open slots ready for booking
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Slots
              </span>
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {totalSlotsCount}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                All time created availability
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Next Upcoming Appointments
            </h2>
            <p className="text-sm text-gray-500">
              Your scheduled client sessions
            </p>
          </div>
          <Link
            to="/provider/appointments"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed border-2">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">
              No upcoming appointments
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Make sure you have open time slots so clients can book you.
            </p>
            <div className="mt-4">
              <Link to="/provider/slots">
                <Button size="sm">Create Availability Slots</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="border border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base">
                      {appointment.client_name
                        ? appointment.client_name.charAt(0).toUpperCase()
                        : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {appointment.client_name || 'Client'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {appointment.client_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-gray-800">
                        {formatDate(appointment.slot_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {formatTimeRange(
                          appointment.start_time,
                          appointment.end_time,
                        )}
                      </span>
                    </div>
                  </div>

                  <Link to="/provider/appointments">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
