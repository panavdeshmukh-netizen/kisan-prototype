import { useState } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BookingFlow from './pages/BookingFlow.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [booking, setBooking] = useState(null)

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    // Restore any previously saved booking
    try {
      const saved = localStorage.getItem('demoBooking')
      if (saved) setBooking(JSON.parse(saved))
    } catch (e) {}
    setCurrentPage('dashboard')
  }

  const handleRegisterSuccess = (userData) => {
    setUser(userData)
    setBooking(null)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setBooking(null)
    setCurrentPage('login')
  }

  const handleBookingDone = (newBooking) => {
    if (newBooking) setBooking(newBooking)
    setCurrentPage('dashboard')
  }

  const handleCancelBooking = () => {
    localStorage.removeItem('demoBooking')
    setBooking(null)
  }

  if (currentPage === 'register') {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onBackToLogin={() => setCurrentPage('login')}
      />
    )
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        user={user}
        booking={booking}
        onLogout={handleLogout}
        onBookNewSlot={() => setCurrentPage('booking')}
        onCancelBooking={handleCancelBooking}
      />
    )
  }

  if (currentPage === 'booking') {
    return <BookingFlow onDone={handleBookingDone} />
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onGoToRegister={() => setCurrentPage('register')}
    />
  )
}

export default App
