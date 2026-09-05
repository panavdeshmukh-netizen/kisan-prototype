import { useState } from 'react'
import './booking/BookingFlow.css'

import CentreSelection from './booking/CentreSelection.jsx'
import DateSelection from './booking/DateSelection.jsx'
import SlotSelection from './booking/SlotSelection.jsx'
import BookingReview from './booking/BookingReview.jsx'
import BookingConfirmation from './booking/BookingConfirmation.jsx'

const farmerName = 'Ramesh Kumar'

const DEMO_CENTRES = [
  { id: 1, name: 'Village Procurement Centre - Sector 12', location: 'Sector 12, Village Road', availableSlots: 8 },
  { id: 2, name: 'Agricultural Procurement Centre - Main Road', location: 'Main Road, Town Centre', availableSlots: 5 },
  { id: 3, name: 'District Procurement Centre - Block A', location: 'Block A, District HQ', availableSlots: 12 },
]

const STEPS = ['centre', 'date', 'slot', 'review', 'confirmation']

const STEP_INFO = {
  centre:       { title: 'Select Procurement Centre', subtitle: 'Step 1 of 4' },
  date:         { title: 'Select Date',                subtitle: 'Step 2 of 4' },
  slot:         { title: 'Select Time Slot',           subtitle: 'Step 3 of 4' },
  review:       { title: 'Review Booking',             subtitle: 'Step 4 of 4' },
  confirmation: { title: 'Booking Confirmation',       subtitle: '' },
}

function generateDemoToken() {
  const randomNumber = Math.floor(Math.random() * 900) + 100
  return `ACB${randomNumber}`
}

function BookingFlow({ onDone }) {
  const [step, setStep] = useState('centre')
  const [selectedCentre, setSelectedCentre] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep('date')
  }

  const handleSelectDate = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
    setStep('review')
  }

  const handleConfirmBooking = () => {
    const newToken = generateDemoToken()
    const booking = {
      id: Date.now(),
      token: newToken,
      farmerName,
      centre: selectedCentre,
      date: selectedDate,
      slot: selectedSlot,
      status: 'Active',
    }
    localStorage.setItem('demoBooking', JSON.stringify(booking))
    setConfirmedBooking(booking)
    setStep('confirmation')
  }

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1])
    } else {
      onDone(null)
    }
  }

  const { title, subtitle } = STEP_INFO[step]

  return (
    <div className="booking-page">
      <header className="booking-header">
        {step !== 'confirmation' && (
          <button type="button" className="booking-back-btn" onClick={handleBack}>
            ← Back
          </button>
        )}
        <div className="booking-header-text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <main className="booking-main">
        {step === 'centre' && (
          <CentreSelection providers={DEMO_CENTRES} onSelect={handleSelectCentre} />
        )}
        {step === 'date' && (
          <DateSelection centre={selectedCentre} onSelect={handleSelectDate} />
        )}
        {step === 'slot' && (
          <SlotSelection centre={selectedCentre} date={selectedDate} onSelect={handleSelectSlot} />
        )}
        {step === 'review' && (
          <BookingReview
            farmerName={farmerName}
            centre={selectedCentre}
            date={selectedDate}
            slot={selectedSlot}
            onConfirm={handleConfirmBooking}
          />
        )}
        {step === 'confirmation' && (
          <BookingConfirmation
            tokenNumber={confirmedBooking?.token}
            centre={selectedCentre}
            date={selectedDate}
            slot={selectedSlot}
            onReturnToDashboard={() => onDone(confirmedBooking)}
          />
        )}
      </main>
    </div>
  )
}

export default BookingFlow
