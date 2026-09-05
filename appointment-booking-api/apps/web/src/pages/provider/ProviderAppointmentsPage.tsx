import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../../types/appointment'

export const ProviderAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null)
  const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(
    null,
  )

  const queryClient = useQueryClient()

  // Fetch provider appointments
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', 'provider', statusFilter],
    queryFn: () =>
      api.appointments.getMyAppointments(
        statusFilter === 'all' ? undefined : statusFilter,
      ),
  })

  const appointments = data?.data || []

  // Complete appointment mutation
  const completeMutation = useMutation({
    mutationFn: (id: number) => api.appointments.completeAppointment(id),
    onSuccess: () => {
      toast.success('Appointment marked as completed!')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setActiveAppointment(null)
      setActionType(null)
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to complete appointment.',
      )
    },
  })

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.appointments.cancelAppointment(id),
    onSuccess: () => {
      toast.success('Appointment cancelled.')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      setActiveAppointment(null)
      setActionType(null)
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to cancel appointment.',
      )
    },
  })

  const handleAction = () => {
    if (!activeAppointment) return
    if (actionType === 'complete') {
      completeMutation.mutate(activeAppointment.id)
    } else if (actionType === 'cancel') {
      cancelMutation.mutate(activeAppointment.id)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Client Appointments
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review scheduled appointments and manage completion status
        </p>
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
            {tab === 'all' ? 'All Appointments' : tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <LoadingSpinner message="Loading client appointments..." />
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
              ? `You currently have no ${statusFilter} appointments.`
              : 'You have no client appointments yet. Make sure your availability slots are open for clients to book.'
          }
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
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                      {appointment.client_name
                        ? appointment.client_name.charAt(0).toUpperCase()
                        : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">
                        {appointment.client_name || 'Client'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {appointment.client_email}
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
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setActiveAppointment(appointment)
                        setActionType('cancel')
                      }}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setActiveAppointment(appointment)
                        setActionType('complete')
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!activeAppointment && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAppointment(null)
            setActionType(null)
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-1">
            {actionType === 'complete' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <DialogTitle>
              {actionType === 'complete'
                ? 'Mark Appointment Completed'
                : 'Cancel Appointment'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {actionType === 'complete'
              ? 'Are you sure you want to mark this appointment as completed?'
              : 'Are you sure you want to cancel this booking? The slot will become available again for booking.'}
          </DialogDescription>
        </DialogHeader>

        {activeAppointment && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm space-y-1 my-2">
            <p>
              <strong className="text-gray-700">Client:</strong>{' '}
              {activeAppointment.client_name} ({activeAppointment.client_email})
            </p>
            <p>
              <strong className="text-gray-700">Date & Time:</strong>{' '}
              {formatDate(activeAppointment.slot_date)} at{' '}
              {formatTime(activeAppointment.start_time)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setActiveAppointment(null)
              setActionType(null)
            }}
          >
            Dismiss
          </Button>
          <Button
            variant={actionType === 'complete' ? 'default' : 'destructive'}
            onClick={handleAction}
            isLoading={completeMutation.isPending || cancelMutation.isPending}
          >
            {actionType === 'complete'
              ? 'Complete Session'
              : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
