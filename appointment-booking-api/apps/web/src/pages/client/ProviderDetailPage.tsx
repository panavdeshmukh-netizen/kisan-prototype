import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
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
import { formatDate, formatTimeRange } from '../../lib/utils'
import { Calendar, Clock, ArrowLeft, CalendarDays } from 'lucide-react'
import type { TimeSlot } from '../../types/slot'

export const ProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const providerId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Selected date filter (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  )
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Fetch providers list to get current provider profile
  const { data: providersData, isLoading: isProviderLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.providers.getProviders(),
  })

  const provider = providersData?.data?.find((p) => p.id === providerId)

  // Fetch available slots for this provider
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    error: slotsError,
  } = useQuery({
    queryKey: ['available-slots', providerId, selectedDate],
    queryFn: () =>
      api.slots.getAvailableSlots(providerId, selectedDate || undefined),
    enabled: !!providerId,
  })

  const availableSlots = slotsData?.data || []

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: (slotId: number) => api.appointments.bookAppointment(slotId),
    onSuccess: () => {
      toast.success('Appointment booked successfully!', {
        description: `Your appointment with ${provider?.name} has been confirmed.`,
      })
      queryClient.invalidateQueries({
        queryKey: ['available-slots', providerId],
      })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setIsBookingModalOpen(false)
      setSelectedSlot(null)
      navigate('/my-appointments')
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          'Failed to book appointment. The slot may have just been taken.',
      )
      queryClient.invalidateQueries({
        queryKey: ['available-slots', providerId],
      })
      setIsBookingModalOpen(false)
    },
  })

  const handleOpenBooking = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsBookingModalOpen(true)
  }

  const handleConfirmBooking = () => {
    if (selectedSlot) {
      bookMutation.mutate(selectedSlot.id)
    }
  }

  if (isProviderLoading) {
    return (
      <LoadingSpinner
        message="Loading provider details..."
        className="min-h-[50vh]"
      />
    )
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">Provider not found</h2>
        <p className="text-sm text-gray-500 mt-2">
          The requested provider profile does not exist.
        </p>
        <Link to="/discover" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Providers
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/discover"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Provider Directory
        </Link>
      </div>

      {/* Provider Hero Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold flex-shrink-0 shadow-lg shadow-blue-500/30">
            {provider.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5 flex-1">
            <Badge className="bg-blue-500/30 text-blue-200 border-0">
              {provider.specialization || 'Professional Consultant'}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">{provider.name}</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {provider.bio ||
                'Dedicated to providing high quality and individualized care and services.'}
            </p>
            {provider.hourly_rate && (
              <p className="text-sm text-blue-300 pt-1">
                <span className="font-bold text-white text-lg">
                  ${provider.hourly_rate}
                </span>{' '}
                / hour
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Available Slots Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Available Time Slots</span>
            </h2>
            <p className="text-sm text-gray-500">
              Select a date to view available appointment slots
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date:
            </span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto h-10 bg-white"
            />
          </div>
        </div>

        {isSlotsLoading ? (
          <LoadingSpinner message="Checking available slots..." />
        ) : slotsError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
            Failed to load time slots for this date.
          </div>
        ) : availableSlots.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No slots available for this date"
            description={`Provider ${provider.name} has no open slots on ${selectedDate}. Try selecting another date.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSlots.map((slot) => (
              <Card
                key={slot.id}
                className="hover:border-blue-500 hover:shadow-md transition-all border-gray-200 cursor-pointer group"
                onClick={() => handleOpenBooking(slot)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-bold text-base text-gray-900">
                        {formatTimeRange(slot.start_time, slot.end_time)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Duration:{' '}
                      <span className="font-semibold text-gray-700">
                        {slot.duration} mins
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="group-hover:bg-blue-700"
                  >
                    Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogHeader>
          <DialogTitle>Confirm Appointment</DialogTitle>
          <DialogDescription>
            Review your booking details before confirming
          </DialogDescription>
        </DialogHeader>

        {selectedSlot && (
          <div className="space-y-4 my-2">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service Provider:</span>
                <span className="font-bold text-gray-900">{provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Specialization:</span>
                <span className="font-semibold text-gray-800">
                  {provider.specialization || 'Consultant'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(selectedSlot.slot_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-bold text-blue-700">
                  {formatTimeRange(
                    selectedSlot.start_time,
                    selectedSlot.end_time,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-semibold text-gray-800">
                  {selectedSlot.duration} minutes
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You will receive real-time updates and notification status for
              this booking.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsBookingModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            isLoading={bookMutation.isPending}
          >
            Confirm Booking
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
