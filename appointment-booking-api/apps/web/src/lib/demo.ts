/**
 * Demo / Mock Data Service
 * ─────────────────────────────────────────────────────────────────
 * Provides a fully functional in-memory + localStorage data layer
 * for the hackathon demo when the backend / PostgreSQL is unavailable.
 * All public API mirrors the real api.ts shape so callers are identical.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface DemoUser {
  id: number
  name: string
  email: string
  password: string // plain (demo only)
  role: 'client' | 'provider' | 'farmer'
}

export interface DemoCenter {
  id: number
  name: string
  location: string
  district: string
  capacity: number
  active: boolean
}

export interface DemoSlot {
  id: number
  centreId: number
  slotDate: string  // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string   // HH:MM
  capacity: number
  bookedCount: number
  status: 'open' | 'full' | 'closed'
}

export interface DemoBooking {
  id: number
  farmerId: number
  centreId: number
  slotId: number
  tokenNumber: string
  status: 'booked' | 'cancelled' | 'completed'
  createdAt: string
  // Denormalized for display
  centreName: string
  centreLocation: string
  slotDate: string
  startTime: string
  endTime: string
}

// ─── Seed Data ────────────────────────────────────────────────────

const DEMO_USERS: DemoUser[] = [
  { id: 1, name: 'Jane Smith', email: 'jane@example.com', password: 'Password1', role: 'client' },
  { id: 2, name: 'Dr. Michael Chen', email: 'doc@example.com', password: 'Password1', role: 'provider' },
  { id: 3, name: 'Arjun Patel', email: 'farmer@example.com', password: 'Password1', role: 'farmer' },
  { id: 4, name: 'Demo User', email: 'demo@demo.com', password: 'demo1234', role: 'client' },
]

export const DEMO_CENTERS: DemoCenter[] = [
  {
    id: 1,
    name: 'Apni Mandi — Sector 17',
    location: 'Sector 17, Chandigarh',
    district: 'Chandigarh',
    capacity: 80,
    active: true,
  },
  {
    id: 2,
    name: 'Kisan Sewa Kendra — Ludhiana',
    location: 'Model Town, Ludhiana',
    district: 'Ludhiana',
    capacity: 120,
    active: true,
  },
  {
    id: 3,
    name: 'Grain Market — Amritsar',
    location: 'Lawrence Road, Amritsar',
    district: 'Amritsar',
    capacity: 100,
    active: true,
  },
  {
    id: 4,
    name: 'Agri Hub — Patiala',
    location: 'Lehal Road, Patiala',
    district: 'Patiala',
    capacity: 60,
    active: true,
  },
  {
    id: 5,
    name: 'Pradhan Mandi — Jalandhar',
    location: 'GT Road, Jalandhar',
    district: 'Jalandhar',
    capacity: 90,
    active: true,
  },
]

// Generate realistic time slots for the next 14 days
function generateSlots(): DemoSlot[] {
  const slots: DemoSlot[] = []
  let id = 1
  const times = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
  ]

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const d = new Date()
    d.setDate(d.getDate() + dayOffset)
    const slotDate = d.toISOString().split('T')[0]

    for (const centre of DEMO_CENTERS) {
      for (const t of times) {
        const bookedCount = Math.floor(Math.random() * 5)
        slots.push({
          id: id++,
          centreId: centre.id,
          slotDate,
          startTime: t.start,
          endTime: t.end,
          capacity: 10,
          bookedCount,
          status: bookedCount >= 10 ? 'full' : 'open',
        })
      }
    }
  }
  return slots
}

// ─── Storage Helpers ──────────────────────────────────────────────

const STORAGE_KEYS = {
  bookings: 'demo_bookings',
  nextBookingId: 'demo_next_booking_id',
  nextUserId: 'demo_next_user_id',
  users: 'demo_registered_users',
}

function getStoredBookings(): DemoBooking[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]')
  } catch {
    return []
  }
}

function saveBookings(bookings: DemoBooking[]): void {
  localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings))
}

function getNextBookingId(): number {
  const id = parseInt(localStorage.getItem(STORAGE_KEYS.nextBookingId) || '1', 10)
  localStorage.setItem(STORAGE_KEYS.nextBookingId, String(id + 1))
  return id
}

function getStoredUsers(): DemoUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]')
  } catch {
    return []
  }
}

function saveUsers(users: DemoUser[]): void {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

function getAllUsers(): DemoUser[] {
  return [...DEMO_USERS, ...getStoredUsers()]
}

function getNextUserId(): number {
  const stored = getStoredUsers()
  const allIds = [...DEMO_USERS.map((u) => u.id), ...stored.map((u) => u.id)]
  return Math.max(...allIds, 100) + 1
}

// ─── Token Generation ─────────────────────────────────────────────

export function generateToken(centreName: string, slotDate: string): string {
  const code = centreName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
  const datePart = slotDate.replace(/-/g, '').slice(4) // MMDD
  const rand = Math.floor(100 + Math.random() * 900)
  return `TKN-${code}-${datePart}-${rand}`
}

// ─── Lazy Slot Cache ──────────────────────────────────────────────

let _slotsCache: DemoSlot[] | null = null

function getSlots(): DemoSlot[] {
  if (!_slotsCache) {
    _slotsCache = generateSlots()
  }
  return _slotsCache
}

// ─── Demo Service API ─────────────────────────────────────────────

export const demoService = {
  /** Authenticate and return a fake JWT-like token */
  login(email: string, password: string): { token: string; user: Omit<DemoUser, 'password'> } {
    const users = getAllUsers()
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (!user) {
      const err: any = new Error('Invalid email or password')
      err.isDemoError = true
      err.status = 401
      throw err
    }
    const { password: _pw, ...safeUser } = user
    const token = `demo_token_${safeUser.id}_${Date.now()}`
    return { token, user: safeUser }
  },

  /** Register a new demo user */
  register(data: {
    name: string
    email: string
    password: string
    role: 'client' | 'provider' | 'farmer'
    phone?: string
  }): Omit<DemoUser, 'password'> {
    const users = getAllUsers()
    if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      const err: any = new Error(`User with email ${data.email} already exists`)
      err.isDemoError = true
      err.status = 409
      throw err
    }
    const newUser: DemoUser = {
      id: getNextUserId(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    }
    const stored = getStoredUsers()
    stored.push(newUser)
    saveUsers(stored)
    const { password: _pw, ...safeUser } = newUser
    return safeUser
  },

  /** Validate a demo token and return the user */
  getProfile(token: string): Omit<DemoUser, 'password'> | null {
    if (!token.startsWith('demo_token_')) return null
    const parts = token.split('_')
    const userId = parseInt(parts[2], 10)
    const users = getAllUsers()
    const user = users.find((u) => u.id === userId)
    if (!user) return null
    const { password: _pw, ...safeUser } = user
    return safeUser
  },

  /** Get all active procurement centres */
  getCentres(): DemoCenter[] {
    return DEMO_CENTERS.filter((c) => c.active)
  },

  /** Get available slots for a centre and date */
  getSlots(centreId: number, date: string): DemoSlot[] {
    const booked = getStoredBookings()
      .filter((b) => b.status === 'booked' && b.centreId === centreId && b.slotDate === date)
      .map((b) => b.slotId)

    return getSlots().filter(
      (s) =>
        s.centreId === centreId &&
        s.slotDate === date &&
        s.status !== 'full' &&
        !booked.includes(s.id),
    )
  },

  /** Create a booking */
  createBooking(data: {
    userId: number
    centreId: number
    slotId: number
  }): DemoBooking {
    const slots = getSlots()
    const slot = slots.find((s) => s.id === data.slotId)
    if (!slot) throw new Error('Slot not found')

    const centre = DEMO_CENTERS.find((c) => c.id === data.centreId)
    if (!centre) throw new Error('Centre not found')

    const bookings = getStoredBookings()

    // Check duplicate active booking
    const existing = bookings.find(
      (b) =>
        b.farmerId === data.userId &&
        b.slotId === data.slotId &&
        b.status === 'booked',
    )
    if (existing) {
      const err: any = new Error('You already have a booking for this slot')
      err.isDemoError = true
      err.status = 409
      throw err
    }

    const booking: DemoBooking = {
      id: getNextBookingId(),
      farmerId: data.userId,
      centreId: data.centreId,
      slotId: data.slotId,
      tokenNumber: generateToken(centre.name, slot.slotDate),
      status: 'booked',
      createdAt: new Date().toISOString(),
      centreName: centre.name,
      centreLocation: centre.location,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }

    bookings.push(booking)
    saveBookings(bookings)
    return booking
  },

  /** Get all bookings for a user */
  getMyBookings(userId: number): DemoBooking[] {
    return getStoredBookings()
      .filter((b) => b.farmerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  /** Cancel a booking */
  cancelBooking(bookingId: number, userId: number): DemoBooking {
    const bookings = getStoredBookings()
    const idx = bookings.findIndex((b) => b.id === bookingId && b.farmerId === userId)
    if (idx === -1) throw new Error('Booking not found')
    bookings[idx].status = 'cancelled'
    saveBookings(bookings)
    return bookings[idx]
  },

  /** Check if a token looks like a demo token */
  isDemoToken(token: string): boolean {
    return token?.startsWith('demo_token_') ?? false
  },
}
