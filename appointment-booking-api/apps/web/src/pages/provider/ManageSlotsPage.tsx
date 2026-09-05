import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
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
import { formatDate, formatTimeRange } from '../../lib/utils'
import { Calendar, Clock, Plus, Trash2, CalendarDays } from 'lucide-react'
import type { TimeSlot } from '../../types/slot'

export const ManageSlotsPage: React.FC = () => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form state for creating slot
  const [slotDate, setSlotDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
  )
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('10:00')
  const [duration, setDuration] = useState<number>(60)

  const queryClient = useQueryClient()

  // Fetch provider slots
  const { data, isLoading, error } = useQuery({
    queryKey: ['slots', 'my-slots', selectedDateFilter],
    queryFn: () => api.slots.getMySlots(selectedDateFilter || undefined),
  })

  const slots = data?.data || []

  // Create slot mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api.slots.createSlot({
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        duration: Number(duration),
      }),
    onSuccess: () => {
      toast.success('Availability slot created successfully!')
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      setIsCreateModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create time slot.')
    },
  })

  // Delete slot mutation
  const deleteMutation = useMutation({
    mutationFn: (slotId: number) => api.slots.deleteSlot(slotId),
    onSuccess: () => {
      toast.success('Time slot deleted.')
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete time slot.')
    },
  })

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault()
    if (endTime <= startTime) {
      toast.error('End time must be chronologically after start time.')
      return
    }
    createMutation.mutate()
  }

  const handleDeleteSlot = (slot: TimeSlot) => {
    if (slot.is_booked) {
      toast.error('Cannot delete an already booked time slot.')
      return
    }
    if (confirm('Are you sure you want to delete this availability slot?')) {
      deleteMutation.mutate(slot.id)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Availability Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define and maintain your open time slots for client bookings
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Time Slot
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <span className="text-xs font-semibold uppercase text-gray-500">
          Filter by Date:
        </span>
        <Input
          type="date"
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value)}
          className="w-auto h-9 bg-gray-50"
        />
        {selectedDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDateFilter('')}
            className="text-xs"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Slots List */}
      {isLoading ? (
        <LoadingSpinner message="Loading your availability slots..." />
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Failed to load your slots. Please check your connection.
        </div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No availability slots found"
          description={
            selectedDateFilter
              ? `You have no time slots defined for ${selectedDateFilter}.`
              : "You haven't defined any availability slots yet. Add slots so clients can book appointments with you."
          }
          actionLabel="Create First Slot"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <Card
              key={slot.id}
              className={`border transition-all overflow-hidden ${
                slot.is_booked
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-gray-200 bg-white hover:shadow-md'
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-800">
                        {formatDate(slot.slot_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-base font-bold text-gray-900">
                        {formatTimeRange(slot.start_time, slot.end_time)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={slot.is_booked ? 'default' : 'success'}>
                    {slot.is_booked ? 'Booked' : 'Available'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>Duration: {slot.duration} min</span>
                  {!slot.is_booked && (
                    <button
                      onClick={() => handleDeleteSlot(slot)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Slot Modal Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <form onSubmit={handleCreateSlot}>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Create a new bookable time slot for clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="slot_date">Slot Date</Label>
              <Input
                id="slot_date"
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start Time (HH:MM)</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_time">End Time (HH:MM)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">Session Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Slot
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
