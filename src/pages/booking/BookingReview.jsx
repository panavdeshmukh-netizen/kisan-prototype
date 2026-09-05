function BookingReview({ farmerName, centre, date, slot, onConfirm }) {
  return (
    <div className="info-card">
      <div className="info-row">
        <span className="info-label">Farmer Name</span>
        <span className="info-value">{farmerName}</span>
      </div>
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

      <button className="primary-btn" onClick={onConfirm}>
        Confirm Booking
      </button>
    </div>
  )
}

export default BookingReview
