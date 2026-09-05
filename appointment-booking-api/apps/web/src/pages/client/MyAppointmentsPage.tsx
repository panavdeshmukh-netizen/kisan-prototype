import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { toast } from 'sonner'
import { formatDate, formatTime, formatTimeRange } from '../../lib/utils'
import { Calendar, Clock, AlertTriangle, Compass } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../../types/appointment'

export const MyAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', 'client', statusFilter],
    queryFn: () =>
      api.appointments.getMyAppointments(
        statusFilter === 'all' ? undefined : statusFilter,
      ),
  })

  const appointments = data?.data || []

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.appointments.cancelAppointment(id),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully.')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
      setIsCancelModalOpen(false)
      setAppointmentToCancel(null)
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to cancel appointment.',
      )
    },
  })

  const handleOpenCancelModal = (appointment: Appointment) => {
    setAppointmentToCancel(appointment)
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = () => {
    if (appointmentToCancel) {
      cancelMutation.mutate(appointmentToCancel.id)
    }
  }

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'booked':
        return <Badge variant="default">Booked (Upcoming)</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your upcoming and past appointments
          </p>
        </div>
        <Link to="/discover">
          <Button>
            <Compass className="mr-2 h-4 w-4" /> Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {['all', 'booked', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab === 'all' ? 'All Bookings' : tab}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {isLoading ? (
        <LoadingSpinner message="Loading your appointments..." />
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Failed to load appointments.
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={
            statusFilter !== 'all'
              ? `You have no ${statusFilter} appointments.`
              : "You haven't booked any appointments yet. Discover top service providers and book your first slot!"
          }
          actionLabel="Find Providers"
          onAction={() => (window.location.href = '/discover')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      {appointment.provider_name
                        ? appointment.provider_name.charAt(0).toUpperCase()
                        : 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">
                        {appointment.provider_name || 'Service Provider'}
                      </h3>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                        {appointment.specialization || 'Consultant'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">
                      {formatDate(appointment.slot_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span>
                      {formatTimeRange(
                        appointment.start_time,
                        appointment.end_time,
                      )}{' '}
                      ({appointment.duration}m)
                    </span>
                  </div>
                </div>

                {appointment.status === 'booked' && (
                  <div className="pt-3 border-t border-gray-100 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenCancelModal(appointment)}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogHeader>
          <div className="flex items-center space-x-2 text-red-600 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Cancel Appointment</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to cancel this appointment? The time slot will
            become available for other clients to book.
          </DialogDescription>
        </DialogHeader>

        {appointmentToCancel && (
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-sm space-y-1.5 my-2">
            <p>
              <strong className="text-gray-700">Provider:</strong>{' '}
              {appointmentToCancel.provider_name}
            </p>
            <p>
              <strong className="text-gray-700">Date & Time:</strong>{' '}
              {formatDate(appointmentToCancel.slot_date)} at{' '}
              {formatTime(appointmentToCancel.start_time)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmCancel}
            isLoading={cancelMutation.isPending}
          >
            Yes, Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
