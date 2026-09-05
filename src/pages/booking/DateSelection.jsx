import React, { useState } from 'react'
import './DateSelection.css'

function DateSelection({ centre, onSelect }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const dates = [
    'September 6, 2026',
    'September 7, 2026',
    'September 8, 2026',
    'September 9, 2026',
    'September 10, 2026',
  ]

  const handleDateClick = (date) => {
    setSelectedDate(date)

    setTimeout(() => {
      onSelect(date)
    }, 300)
  }

  return (
    <div className="date-selection">

      {centre && (
        <div className="selected-centre-card">
          <div className="centre-info-icon">🌾</div>

          <div>
            <span>Selected Procurement Centre</span>
            <h3>{centre.name}</h3>
          </div>

          <div className="verified-badge">
            ✓ Verified
          </div>
        </div>
      )}

      <div className="date-selection-header">
        <div>
          <p className="section-label">AVAILABLE DATES</p>

          <h2>Choose your preferred date</h2>

          <p className="section-subtitle">
            Select a date to view available time slots
          </p>
        </div>
      </div>

      <div className="date-grid">
        {dates.map((date) => {
          const dateObject = new Date(date)

          const day = dateObject.toLocaleDateString('en-US', {
            weekday: 'short',
          })

          const month = dateObject.toLocaleDateString('en-US', {
            month: 'short',
          })

          const dayNumber = dateObject.getDate()

          return (
            <button
              key={date}
              className={`date-card ${
                selectedDate === date ? 'selected-date' : ''
              }`}
              onClick={() => handleDateClick(date)}
            >
              <div className="calendar-icon">📅</div>

              <span className="date-day">{day}</span>

              <span className="date-number">
                {dayNumber}
              </span>

              <span className="date-month">
                {month}
              </span>

              {selectedDate === date && (
                <div className="selected-check">✓</div>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}

export default DateSelection