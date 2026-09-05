import { useState } from 'react'
import './DateSelection.css'

function getNextDays(count) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function DateSelection({ centre, onSelect }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const dates = getNextDays(7)

  const handleDateClick = (dateObj) => {
    const label = dateObj.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    setSelectedDate(label)
    setTimeout(() => { onSelect(label) }, 300)
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
          <div className="verified-badge">✓ Verified</div>
        </div>
      )}

      <div className="date-selection-header">
        <div>
          <p className="section-label">AVAILABLE DATES</p>
          <h2>Choose your preferred date</h2>
          <p className="section-subtitle">Select a date to view available time slots</p>
        </div>
      </div>

      <div className="date-grid">
        {dates.map((dateObj, idx) => {
          const label = dateObj.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
          })
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
          const dayNum = dateObj.getDate()
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' })
          const isToday = idx === 0
          const isSelected = selectedDate === label

          return (
            <button
              key={label}
              className={`date-card ${isSelected ? 'selected-date' : ''}`}
              onClick={() => handleDateClick(dateObj)}
            >
              <div className="calendar-icon">📅</div>
              <span className="date-day">{isToday ? 'Today' : dayName}</span>
              <span className="date-number">{dayNum}</span>
              <span className="date-month">{monthName}</span>
              {isSelected && <div className="selected-check">✓</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DateSelection
