import { useState } from 'react'
import './Dashboard.css'

const statusSteps = [
  { id: 1, label: 'Booking Confirmed', state: 'completed' },
  { id: 2, label: 'Farmer Verified', state: 'completed' },
  { id: 3, label: 'Procurement Pending', state: 'current' },
  { id: 4, label: 'Payment Pending', state: 'pending' },
]

function computeQueueStatus(token) {
  const match = token && token.match(/(\d+)$/)
  const tokenNum = match ? parseInt(match[1]) : 100
  const peopleAhead = (tokenNum % 6) + 2
  const currentNum = Math.max(1, tokenNum - peopleAhead)
  const prefix = token ? token.replace(/\d+$/, '') : 'T-'
  const currentToken = prefix + currentNum
  const estimatedWait = `~${peopleAhead * 5} mins`
  const fillPercent = Math.round((currentNum / tokenNum) * 100)
  return { currentToken, farmerToken: token, peopleAhead, estimatedWait, fillPercent }
}

function EmptyBookingState({ onBookNewSlot }) {
  return (
    <div className="no-booking-card">
      <div className="no-booking-icon">📋</div>
      <h3 className="no-booking-title">No Active Booking</h3>
      <p className="no-booking-text">
        You have no upcoming slot booked at a procurement centre.
        Book a slot to get started!
      </p>
      <button className="book-slot-btn-empty" onClick={onBookNewSlot}>
        + Book a Slot Now
      </button>
    </div>
  )
}

function Dashboard({ user, booking, onLogout, onBookNewSlot, onCancelBooking }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const farmerName = user?.name || 'Farmer'
  const queue = booking ? computeQueueStatus(booking.token) : null

  const handleCancelClick = () => setShowCancelConfirm(true)
  const handleCancelConfirm = () => {
    setShowCancelConfirm(false)
    onCancelBooking()
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="header-logo">🌾</span>
          <span className="header-app-name">KisanQueue</span>
        </div>
        <div className="header-right">
          <div className="header-profile">
            <span className="profile-avatar">{farmerName.charAt(0).toUpperCase()}</span>
            <span className="profile-name">{farmerName}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome */}
        <section className="welcome-section">
          <h1>Welcome, {farmerName} 🌾</h1>
          <p>Manage your procurement centre bookings and track your queue status, all in one place.</p>
        </section>

        {/* Action row */}
        <div className="primary-action-row">
          <button className="book-slot-btn" onClick={onBookNewSlot}>+ Book New Slot</button>
        </div>

        {/* No booking state */}
        {!booking && <EmptyBookingState onBookNewSlot={onBookNewSlot} />}

        {/* Active booking */}
        {booking && (
          <>
            <div className="cards-grid">
              {/* Current Booking card */}
              <section className="dash-card">
                <div className="card-title-row">
                  <h2 className="card-title">Current Booking</h2>
                  <button className="cancel-booking-btn" onClick={handleCancelClick}>
                    Cancel
                  </button>
                </div>
                <div className="card-row">
                  <span className="card-label">Procurement Centre</span>
                  <span className="card-value">{booking.centre?.name || booking.centre}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Date</span>
                  <span className="card-value">{booking.date}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Time Slot</span>
                  <span className="card-value">{booking.slot}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Token Number</span>
                  <span className="card-value token-value">{booking.token}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Status</span>
                  <span className="status-badge status-confirmed">Confirmed</span>
                </div>
              </section>

              {/* Queue Status card */}
              <section className="dash-card">
                <h2 className="card-title">Queue Status</h2>
                <div className="card-row">
                  <span className="card-label">Current Token</span>
                  <span className="card-value">{queue.currentToken}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Your Token</span>
                  <span className="card-value token-value">{queue.farmerToken}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">People Ahead</span>
                  <span className="card-value">{queue.peopleAhead}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">Estimated Wait</span>
                  <span className="card-value">{queue.estimatedWait}</span>
                </div>
                <div className="queue-indicator">
                  <div className="queue-indicator-labels">
                    <span>{queue.currentToken}</span>
                    <span>{queue.farmerToken}</span>
                  </div>
                  <div className="queue-bar-track">
                    <div className="queue-bar-fill" style={{ width: queue.fillPercent + '%' }} />
                  </div>
                  <p className="queue-indicator-note">{queue.peopleAhead} people ahead of you</p>
                </div>
              </section>
            </div>

            {/* Procurement Status timeline */}
            <section className="dash-card timeline-card">
              <h2 className="card-title">Procurement Status</h2>
              <ol className="status-timeline">
                {statusSteps.map((step) => (
                  <li key={step.id} className={`timeline-step timeline-${step.state}`}>
                    <span className="timeline-dot" />
                    <span className="timeline-label">{step.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Cancel Booking?</h3>
            <p className="modal-text">
              Are you sure you want to cancel your booking for{' '}
              <strong>{booking.centre?.name || booking.centre}</strong> on{' '}
              <strong>{booking.date}</strong>?
            </p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowCancelConfirm(false)}>
                Keep Booking
              </button>
              <button className="modal-btn-confirm" onClick={handleCancelConfirm}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
