function BookingConfirmation({ tokenNumber, centre, date, slot, onReturnToDashboard }) {
  return (
    <div className="info-card confirmation-card">
      <div className="confirmation-icon">✅</div>
      <h2 className="confirmation-heading">Booking Confirmed</h2>

      <p className="confirmation-token-label">Your Token Number</p>
      <p className="confirmation-token">{tokenNumber}</p>

      <div className="confirmation-details">
        <div className="info-row">
          <span className="info-label">Procurement Centre</span>
          <span className="info-value">{centre?.name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Date</span>
          <span className="info-value">{date}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Time Slot</span>
          <span className="info-value">{slot}</span>
        </div>
      </div>

      <button className="primary-btn" onClick={onReturnToDashboard}>
        Return to Dashboard
      </button>
    </div>
  )
}

export default BookingConfirmation
