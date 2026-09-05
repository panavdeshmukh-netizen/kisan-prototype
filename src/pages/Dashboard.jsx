import './Dashboard.css'

// ---- Dummy data (no backend/API yet) ----
const farmer = {
  name: 'Ramesh Kumar',
}

const currentBooking = {
  centre: 'Village Procurement Centre - Sector 12',
  date: '12 Sep 2026',
  timeSlot: '10:00 AM - 11:00 AM',
  tokenNumber: 'T-047',
  status: 'Confirmed',
}

const queueStatus = {
  currentToken: 'T-041',
  farmerToken: 'T-047',
  peopleAhead: 6,
  estimatedWait: '~35 mins',
}

const statusSteps = [
  { id: 1, label: 'Booking Confirmed', state: 'completed' },
  { id: 2, label: 'Farmer Verified', state: 'completed' },
  { id: 3, label: 'Procurement Pending', state: 'current' },
  { id: 4, label: 'Payment Pending', state: 'pending' },
]

function Dashboard({ onLogout, onBookNewSlot }) {
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
            <span className="profile-avatar">{farmer.name.charAt(0)}</span>
            <span className="profile-name">{farmer.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome section */}
        <section className="welcome-section">
          <h1>Welcome, Farmer 🌾</h1>
          <p>
            Manage your procurement centre bookings and track your queue status,
            all in one place.
          </p>
        </section>

        {/* Primary action */}
        <div className="primary-action-row">
          <button className="book-slot-btn" onClick={onBookNewSlot}>
            + Book New Slot
          </button>
        </div>

        {/* Cards grid: Current Booking + Queue Status */}
        <div className="cards-grid">
          {/* Current Booking card */}
          <section className="dash-card">
            <h2 className="card-title">Current Booking</h2>
            <div className="card-row">
              <span className="card-label">Procurement Centre</span>
              <span className="card-value">{currentBooking.centre}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Date</span>
              <span className="card-value">{currentBooking.date}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Time Slot</span>
              <span className="card-value">{currentBooking.timeSlot}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Token Number</span>
              <span className="card-value token-value">{currentBooking.tokenNumber}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Status</span>
              <span className="status-badge status-confirmed">{currentBooking.status}</span>
            </div>
          </section>

          {/* Queue Status card */}
          <section className="dash-card">
            <h2 className="card-title">Queue Status</h2>
            <div className="card-row">
              <span className="card-label">Current Token</span>
              <span className="card-value">{queueStatus.currentToken}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Your Token</span>
              <span className="card-value token-value">{queueStatus.farmerToken}</span>
            </div>
            <div className="card-row">
              <span className="card-label">People Ahead</span>
              <span className="card-value">{queueStatus.peopleAhead}</span>
            </div>
            <div className="card-row">
              <span className="card-label">Estimated Wait</span>
              <span className="card-value">{queueStatus.estimatedWait}</span>
            </div>

            {/* Visual queue indicator */}
            <div className="queue-indicator">
              <div className="queue-indicator-labels">
                <span>{queueStatus.currentToken}</span>
                <span>{queueStatus.farmerToken}</span>
              </div>
              <div className="queue-bar-track">
                <div className="queue-bar-fill" style={{ width: '38%' }} />
              </div>
              <p className="queue-indicator-note">
                {queueStatus.peopleAhead} people ahead of you
              </p>
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
      </main>
    </div>
  )
}

export default Dashboard
