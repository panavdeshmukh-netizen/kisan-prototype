import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  demoService,
  DEMO_CENTERS,
  type DemoCenter,
  type DemoSlot,
  type DemoBooking,
} from '../../lib/demo'
import { formatDate, formatTime } from '../../lib/utils'
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Ticket,
  Home,
  Users,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

// ─── Step Indicator ───────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Centre', icon: MapPin },
  { id: 2, label: 'Date', icon: Calendar },
  { id: 3, label: 'Slot', icon: Clock },
  { id: 4, label: 'Confirm', icon: CheckCircle2 },
]

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((step, idx) => {
      const isDone = currentStep > step.id
      const isActive = currentStep === step.id
      const Icon = step.icon
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all font-bold text-sm ${
                isDone
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`text-xs font-semibold ${
                isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-12 sm:w-20 mx-1 mb-4 rounded-full transition-all ${
                currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      )
    })}
  </div>
)

// ─── Step 1: Select Centre ────────────────────────────────────────

const SelectCentre: React.FC<{
  selected: DemoCenter | null
  onSelect: (c: DemoCenter) => void
  onNext: () => void
}> = ({ selected, onSelect, onNext }) => {
  const [search, setSearch] = useState('')
  const centres = DEMO_CENTERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select a Centre</h2>
        <p className="text-gray-500 text-sm mt-1">Choose the procurement centre nearest to you</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Centre Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {centres.map((centre) => {
          const isSelected = selected?.id === centre.id
          return (
            <button
              key={centre.id}
              onClick={() => onSelect(centre)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-500/10'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                    {centre.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{centre.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      Capacity: {centre.capacity}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {centre.district}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selected} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 2: Select Date ──────────────────────────────────────────

const SelectDate: React.FC<{
  selected: string
  onSelect: (date: string) => void
  onNext: () => void
  onBack: () => void
}> = ({ selected, onSelect, onNext, onBack }) => {
  // Generate next 14 days
  const dates: Array<{ value: string; display: Date; isPast: boolean }> = []
  for (let i = 0; i <= 13; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push({
      value: d.toISOString().split('T')[0],
      display: d,
      isPast: false,
    })
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MONTH_NAMES = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select a Date</h2>
        <p className="text-gray-500 text-sm mt-1">Choose your preferred appointment date</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {dates.map(({ value, display }) => {
          const isSelected = selected === value
          const isToday = value === new Date().toISOString().split('T')[0]
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`flex flex-col items-center p-2 sm:p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                {DAY_NAMES[display.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">{display.getDate()}</span>
              <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                {MONTH_NAMES[display.getMonth()]}
              </span>
              {isToday && !isSelected && (
                <span className="mt-1 h-1 w-1 rounded-full bg-blue-500" />
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Selected: <strong>{formatDate(selected)}</strong>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selected} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Select Slot ─────────────────────────────────────────

const SelectSlot: React.FC<{
  centre: DemoCenter
  date: string
  selected: DemoSlot | null
  onSelect: (slot: DemoSlot) => void
  onNext: () => void
  onBack: () => void
}> = ({ centre, date, selected, onSelect, onNext, onBack }) => {
  const slots = demoService.getSlots(centre.id, date)

  const grouped: Record<string, DemoSlot[]> = {}
  for (const slot of slots) {
    const hour = parseInt(slot.startTime.split(':')[0], 10)
    const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
    if (!grouped[period]) grouped[period] = []
    grouped[period].push(slot)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select a Time Slot</h2>
        <p className="text-gray-500 text-sm mt-1">
          Available slots at <strong>{centre.name}</strong> on{' '}
          <strong>{formatDate(date, { short: true })}</strong>
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No slots available on this date</p>
          <p className="text-gray-400 text-sm mt-1">Please select a different date</p>
        </div>
      ) : (
        Object.entries(grouped).map(([period, periodSlots]) => (
          <div key={period}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {period}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {periodSlots.map((slot) => {
                const isSelected = selected?.id === slot.id
                const spotsLeft = slot.capacity - slot.bookedCount
                return (
                  <button
                    key={slot.id}
                    onClick={() => onSelect(slot)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {formatTime(slot.startTime)}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                      to {formatTime(slot.endTime)}
                    </p>
                    <p className={`text-xs mt-1.5 font-medium ${isSelected ? 'text-blue-100' : 'text-emerald-600'}`}>
                      {spotsLeft} spots left
                    </p>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-white mt-1" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selected} size="lg">
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 4: Confirm Booking ──────────────────────────────────────

const ConfirmBooking: React.FC<{
  centre: DemoCenter
  date: string
  slot: DemoSlot
  onConfirm: () => Promise<DemoBooking>
  onBack: () => void
}> = ({ centre, date, slot, onConfirm, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<DemoBooking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await onConfirm()
      setBooking(result)
      // Notify HomeDashboard to refresh
      window.dispatchEvent(new Event('demo:booking-updated'))
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (booking) {
    // Success State
    return (
      <div className="text-center space-y-6 py-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed! 🎉</h2>
          <p className="text-gray-500 text-sm mt-1">
            Your slot has been reserved. Please arrive on time.
          </p>
        </div>

        {/* Token Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white mx-auto max-w-sm shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Ticket className="h-5 w-5 text-blue-200" />
            <span className="text-sm font-semibold text-blue-200 uppercase tracking-widest">
              Your Token
            </span>
          </div>
          <p className="text-5xl font-black tracking-widest">{booking.tokenNumber}</p>
          <p className="text-blue-200 text-xs mt-3">Present this at the entrance</p>
        </div>

        {/* Booking Summary */}
        <Card className="max-w-sm mx-auto text-left">
          <CardContent className="p-5 space-y-3">
            {[
              { label: 'Centre', value: booking.centreName, icon: MapPin },
              { label: 'Location', value: booking.centreLocation, icon: MapPin },
              { label: 'Date', value: formatDate(booking.slotDate), icon: Calendar },
              {
                label: 'Time',
                value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`,
                icon: Clock,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/my-bookings')}>
            View All Bookings
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Confirm Booking</h2>
        <p className="text-gray-500 text-sm mt-1">Review your details before confirming</p>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-6 space-y-4">
          {[
            { label: 'Centre', value: centre.name, icon: MapPin },
            { label: 'Location', value: centre.location, icon: MapPin },
            { label: 'Date', value: formatDate(date), icon: Calendar },
            {
              label: 'Time Slot',
              value: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`,
              icon: Clock,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Token Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
        <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Token will be generated</p>
          <p className="text-xs text-blue-600">
            Your unique token number is auto-generated on confirmation
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={handleConfirm} isLoading={loading} size="lg" className="px-8">
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  )
}

// ─── Main BookingFlowPage ─────────────────────────────────────────

export const BookingFlowPage: React.FC = () => {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedCentre, setSelectedCentre] = useState<DemoCenter | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<DemoSlot | null>(null)

  // Pre-select today
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }, [])

  const handleConfirm = async (): Promise<DemoBooking> => {
    if (!user || !selectedCentre || !selectedSlot) {
      throw new Error('Missing booking details')
    }
    return demoService.createBooking({
      userId: user.id,
      centreId: selectedCentre.id,
      slotId: selectedSlot.id,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      <Card className="shadow-xl shadow-gray-200/50 border border-gray-100">
        <CardContent className="p-6 sm:p-8">
          {step === 1 && (
            <SelectCentre
              selected={selectedCentre}
              onSelect={setSelectedCentre}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <SelectDate
              selected={selectedDate}
              onSelect={setSelectedDate}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && selectedCentre && (
            <SelectSlot
              centre={selectedCentre}
              date={selectedDate}
              selected={selectedSlot}
              onSelect={setSelectedSlot}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && selectedCentre && selectedSlot && (
            <ConfirmBooking
              centre={selectedCentre}
              date={selectedDate}
              slot={selectedSlot}
              onConfirm={handleConfirm}
              onBack={() => setStep(3)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
