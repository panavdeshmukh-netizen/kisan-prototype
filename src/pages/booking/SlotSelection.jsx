// Dummy time slots (frontend only). Some are marked unavailable.
const timeSlots = [
  { id: 1, time: '09:00 AM - 10:00 AM', available: true },
  { id: 2, time: '10:00 AM - 11:00 AM', available: true },
  { id: 3, time: '11:00 AM - 12:00 PM', available: false },
  { id: 4, time: '02:00 PM - 03:00 PM', available: true },
]

function SlotSelection({ centre, date, onSelect }) {
  return (
    <div>
      {centre && date && (
        <p className="selected-summary">
          {centre.name} • {date}
        </p>
      )}

      <div className="slot-grid">
        {timeSlots.map((slot) => (
          <button
            key={slot.id}
            className={`slot-card ${!slot.available ? 'slot-unavailable' : ''}`}
            onClick={() => slot.available && onSelect(slot.time)}
            disabled={!slot.available}
          >
            {slot.time}
            {!slot.available && <span className="slot-tag">Full</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SlotSelection
