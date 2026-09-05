import { useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BookingFlow from './pages/BookingFlow.jsx'

// Simple screen switcher (no routing library needed for this MVP).
// currentPage can be: "login" | "dashboard" | "booking"
function App() {
  const [currentPage, setCurrentPage] = useState('login')

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        onLogout={() => setCurrentPage('login')}
        onBookNewSlot={() => setCurrentPage('booking')}
      />
    )
  }

  if (currentPage === 'booking') {
    return <BookingFlow onDone={() => setCurrentPage('dashboard')} />
  }

  return <Login onLoginSuccess={() => setCurrentPage('dashboard')} />
}

export default App
