import request from 'supertest'
import jwt from 'jsonwebtoken'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

let app
let pool

const truncateTables = async () => {
  await pool.query(`
    TRUNCATE TABLE appointments, time_slots, service_providers, users
    RESTART IDENTITY CASCADE
  `)
}

const createUser = async ({
  name = 'Test User',
  email = 'test@example.com',
  role = 'client',
} = {}) => {
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, 'hashed-password', $3)
      RETURNING id, name, email, role, created_at
    `,
    [name, email, role],
  )

  return result.rows[0]
}

const createProvider = async ({
  user,
  specialization = 'General Practice',
  description = 'Experienced primary care provider',
} = {}) => {
  const providerUser =
    user ||
    (await createUser({
      name: 'Dr. Provider',
      email: 'provider@example.com',
      role: 'provider',
    }))
  const result = await pool.query(
    `
      INSERT INTO service_providers (user_id, specialization, description)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, specialization, description, created_at
    `,
    [providerUser.id, specialization, description],
  )

  return { user: providerUser, provider: result.rows[0] }
}

const createSlot = async ({
  providerId,
  slotDate = '2026-06-15',
  startTime = '09:00',
  endTime = '10:00',
  duration = 60,
  isBooked = false,
} = {}) => {
  const result = await pool.query(
    `
      INSERT INTO time_slots (
        provider_id,
        slot_date,
        start_time,
        end_time,
        duration,
        is_booked
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, provider_id, slot_date, start_time, end_time, duration, is_booked, created_at
    `,
    [providerId, slotDate, startTime, endTime, duration, isBooked],
  )

  return result.rows[0]
}

const tokenFor = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  )

beforeAll(async () => {
  ;({ default: app } = await import('../../app.js'))

  const databaseModule = await import('../../config/database.js')
  pool = databaseModule.pool

  await databaseModule.connectToDb()
})

beforeEach(async () => {
  await truncateTables()
})

afterAll(async () => {
  await truncateTables()
  await pool.end()
})

describe('Appointments module', () => {
  describe('POST /appointments', () => {
    test('client successfully books an available appointment slot', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const response = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        message: 'Appointment booked successfully',
        data: expect.objectContaining({
          id: expect.any(Number),
          client_id: client.id,
          provider_id: provider.id,
          time_slot_id: slot.id,
          status: 'booked',
          slot_date: expect.any(String),
          start_time: '09:00:00',
        }),
      })

      // Verify slot is now marked as booked
      const slotResult = await pool.query(
        'SELECT is_booked FROM time_slots WHERE id = $1',
        [slot.id],
      )
      expect(slotResult.rows[0].is_booked).toBe(true)
    })

    test('rejects booking from a provider account', async () => {
      const { user: providerUser, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const response = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(providerUser)}`)
        .send({ time_slot_id: slot.id })

      expect(response.status).toBe(403)
      expect(response.body.message).toContain('Access denied')
    })

    test('rejects booking for an already booked slot', async () => {
      const client = await createUser({
        name: 'Client',
        email: 'c@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id, isBooked: true })

      const response = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already booked')
    })

    test('handles concurrent booking requests gracefully without double-booking', async () => {
      const client1 = await createUser({
        name: 'Client 1',
        email: 'c1@example.com',
        role: 'client',
      })
      const client2 = await createUser({
        name: 'Client 2',
        email: 'c2@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/appointments')
          .set('Authorization', `Bearer ${tokenFor(client1)}`)
          .send({ time_slot_id: slot.id }),
        request(app)
          .post('/appointments')
          .set('Authorization', `Bearer ${tokenFor(client2)}`)
          .send({ time_slot_id: slot.id }),
      ])

      const statuses = [res1.status, res2.status].sort()
      expect(statuses[0]).toBe(201)
      expect([400, 409]).toContain(statuses[1])

      const appointmentsCount = await pool.query(
        'SELECT count(*)::int as count FROM appointments WHERE time_slot_id = $1',
        [slot.id],
      )
      expect(appointmentsCount.rows[0].count).toBe(1)
    })
  })

  describe('GET /appointments/my-appointments', () => {
    test('client retrieves their bookings', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const response = await request(app)
        .get('/appointments/my-appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(1)
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          client_id: client.id,
          provider_id: provider.id,
          time_slot_id: slot.id,
          status: 'booked',
        }),
      )
    })

    test('provider retrieves appointments booked with them', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { user: providerUser, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const response = await request(app)
        .get('/appointments/my-appointments')
        .set('Authorization', `Bearer ${tokenFor(providerUser)}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(1)
      expect(response.body.data[0].provider_id).toBe(provider.id)
    })
  })

  describe('GET /appointments/:id', () => {
    test('retrieves appointment by ID for authorized participant', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const bookRes = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const appointmentId = bookRes.body.data.id

      const response = await request(app)
        .get(`/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${tokenFor(client)}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(appointmentId)
    })

    test('forbids unauthorized user from accessing appointment', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const otherUser = await createUser({
        name: 'Other User',
        email: 'other@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const bookRes = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const response = await request(app)
        .get(`/appointments/${bookRes.body.data.id}`)
        .set('Authorization', `Bearer ${tokenFor(otherUser)}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /appointments/:id/cancel', () => {
    test('client cancels appointment and slot becomes available again', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const bookRes = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const appointmentId = bookRes.body.data.id

      const cancelRes = await request(app)
        .put(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${tokenFor(client)}`)

      expect(cancelRes.status).toBe(200)
      expect(cancelRes.body.success).toBe(true)
      expect(cancelRes.body.data.status).toBe('cancelled')

      // Verify slot is available again
      const slotResult = await pool.query(
        'SELECT is_booked FROM time_slots WHERE id = $1',
        [slot.id],
      )
      expect(slotResult.rows[0].is_booked).toBe(false)
    })
  })

  describe('PUT /appointments/:id/complete', () => {
    test('provider marks appointment as completed', async () => {
      const client = await createUser({
        name: 'John Client',
        email: 'client@example.com',
        role: 'client',
      })
      const { user: providerUser, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const bookRes = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({ time_slot_id: slot.id })

      const appointmentId = bookRes.body.data.id

      const completeRes = await request(app)
        .put(`/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${tokenFor(providerUser)}`)

      expect(completeRes.status).toBe(200)
      expect(completeRes.body.success).toBe(true)
      expect(completeRes.body.data.status).toBe('completed')
    })
  })
})
