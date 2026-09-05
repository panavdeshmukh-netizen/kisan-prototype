import request from 'supertest'
import jwt from 'jsonwebtoken'
import {
  createTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots,
  getProviderTimeSlots,
  updateTimeSlot,
} from './timeSlot.service.js'

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
  name = 'Dr. Ada Lovelace',
  email = 'ada@example.com',
  role = 'provider',
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
  const providerUser = user || (await createUser())
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

describe('Time slot module', () => {
  describe('POST /time-slots', () => {
    test('creates a provider time slot', async () => {
      const { user, provider } = await createProvider()

      const response = await request(app)
        .post('/time-slots')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          slot_date: '2026-06-15',
          start_time: '09:00',
          end_time: '10:00',
          duration: 60,
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        message: 'Time slot created successfully',
        data: {
          timeSlot: expect.objectContaining({
            id: expect.any(Number),
            provider_id: provider.id,
            slot_date: expect.any(String),
            start_time: '09:00:00',
            end_time: '10:00:00',
            duration: 60,
            is_booked: false,
            created_at: expect.any(String),
          }),
        },
      })

      const dbResult = await pool.query(
        'SELECT provider_id, start_time, end_time, duration, is_booked FROM time_slots WHERE id = $1',
        [response.body.data.timeSlot.id],
      )

      expect(dbResult.rows[0]).toEqual({
        provider_id: provider.id,
        start_time: '09:00:00',
        end_time: '10:00:00',
        duration: 60,
        is_booked: false,
      })
    })

    test('returns validation and authorization errors', async () => {
      const providerUser = await createUser()
      const client = await createUser({
        name: 'Client User',
        email: 'client@example.com',
        role: 'client',
      })

      const noTokenResponse = await request(app).post('/time-slots').send({})
      expect(noTokenResponse.status).toBe(401)
      expect(noTokenResponse.body).toEqual({
        message: 'Access denied. No token provided.',
      })

      const forbiddenResponse = await request(app)
        .post('/time-slots')
        .set('Authorization', `Bearer ${tokenFor(client)}`)
        .send({
          slot_date: '2026-06-15',
          start_time: '09:00',
          end_time: '10:00',
          duration: 60,
        })
      expect(forbiddenResponse.status).toBe(403)
      expect(forbiddenResponse.body).toEqual({
        message: 'Access denied. Required role: provider',
      })

      const validationResponse = await request(app)
        .post('/time-slots')
        .set('Authorization', `Bearer ${tokenFor(providerUser)}`)
        .send({
          slot_date: 'not-a-date',
          start_time: '25:00',
          end_time: 'bad-time',
          duration: 10,
        })

      expect(validationResponse.status).toBe(400)
      expect(validationResponse.body.success).toBe(false)
      expect(validationResponse.body.message).toBe('Validation failed')
      expect(validationResponse.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'slot_date',
            message: 'Slot date must be in YYYY-MM-DD format',
          },
          {
            field: 'start_time',
            message: 'Start time must be in HH:MM format (e.g., 09:30)',
          },
          {
            field: 'end_time',
            message: 'End time must be in HH:MM format (e.g., 10:30)',
          },
          {
            field: 'duration',
            message: 'Duration must be at least 15 minutes',
          },
        ]),
      )
    })

    test('returns conflict for duplicate provider slots', async () => {
      const { user } = await createProvider()
      const payload = {
        slot_date: '2026-06-15',
        start_time: '09:00',
        end_time: '10:00',
        duration: 60,
      }

      await request(app)
        .post('/time-slots')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send(payload)

      const response = await request(app)
        .post('/time-slots')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send(payload)

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Time slot already exists for this date and time',
      })
    })
  })

  describe('GET /time-slots/my-slots', () => {
    test('returns authenticated provider slots ordered by date and time', async () => {
      const { user, provider } = await createProvider()
      await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '11:00',
        endTime: '12:00',
      })
      const firstSlot = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-15',
        startTime: '08:00',
        endTime: '09:00',
      })

      const response = await request(app)
        .get('/time-slots/my-slots')
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(2)
      expect(response.body.message).toBe('Time slots retrieved successfully')
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          id: firstSlot.id,
          provider_id: provider.id,
          start_time: '08:00:00',
          end_time: '09:00:00',
        }),
      )
    })
  })

  describe('GET /time-slots/available/:providerId', () => {
    test('returns only unbooked slots in the requested date range', async () => {
      const { user, provider } = await createProvider({
        user: await createUser({
          name: 'Dr. Zoe Carter',
          email: 'zoe@example.com',
        }),
        specialization: 'Dermatology',
      })
      const availableSlot = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '09:00',
      })
      await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        isBooked: true,
      })
      await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-20',
        startTime: '09:00',
      })

      const response = await request(app)
        .get(`/time-slots/available/${provider.id}`)
        .query({ startDate: '2026-06-16', endDate: '2026-06-16' })
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Available time slots retrieved successfully',
        count: 1,
        data: [
          expect.objectContaining({
            id: availableSlot.id,
            provider_id: provider.id,
            start_time: '09:00:00',
            duration: 60,
            specialization: 'Dermatology',
            provider_name: 'Dr. Zoe Carter',
          }),
        ],
      })
    })
  })

  describe('PUT /time-slots/:slotId', () => {
    test('updates an owned unbooked time slot', async () => {
      const { user, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const response = await request(app)
        .put(`/time-slots/${slot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          slot_date: '2026-06-18',
          start_time: '13:00',
          end_time: '14:30',
          duration: 90,
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Time slot updated successfully',
        data: {
          timeSlot: expect.objectContaining({
            id: slot.id,
            provider_id: provider.id,
            start_time: '13:00:00',
            end_time: '14:30:00',
            duration: 90,
          }),
        },
      })
    })

    test('returns validation errors for empty or invalid updates', async () => {
      const { user, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const emptyResponse = await request(app)
        .put(`/time-slots/${slot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({})
      expect(emptyResponse.status).toBe(400)
      expect(emptyResponse.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'end_time',
            message: 'At least one field must be provided to update',
          },
        ],
      })

      const invalidResponse = await request(app)
        .put(`/time-slots/${slot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ start_time: '24:01', duration: 481 })
      expect(invalidResponse.status).toBe(400)
      expect(invalidResponse.body.success).toBe(false)
      expect(invalidResponse.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'start_time',
            message: 'Start time must be in HH:MM format (e.g., 09:30)',
          },
          {
            field: 'duration',
            message: 'Duration must not exceed 480 minutes (8 hours)',
          },
        ]),
      )
    })

    test('returns not found or booked errors for invalid updates', async () => {
      const { user, provider } = await createProvider()
      const other = await createProvider({
        user: await createUser({
          name: 'Other Provider',
          email: 'other@example.com',
        }),
      })
      const otherSlot = await createSlot({ providerId: other.provider.id })
      const bookedSlot = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        isBooked: true,
      })

      const notFoundResponse = await request(app)
        .put(`/time-slots/${otherSlot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ duration: 45 })
      expect(notFoundResponse.status).toBe(404)
      expect(notFoundResponse.body).toEqual({
        success: false,
        message: 'Time slot not found or does not belong to you',
      })

      const bookedResponse = await request(app)
        .put(`/time-slots/${bookedSlot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ duration: 45 })
      expect(bookedResponse.status).toBe(400)
      expect(bookedResponse.body).toEqual({
        success: false,
        message: 'Cannot update a booked time slot',
      })
    })

    test('returns conflict when updating to an existing slot time', async () => {
      const { user, provider } = await createProvider()
      await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-15',
        startTime: '09:00',
        endTime: '10:00',
      })
      const slot2 = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-15',
        startTime: '10:00',
        endTime: '11:00',
      })

      const conflictResponse = await request(app)
        .put(`/time-slots/${slot2.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          start_time: '09:00',
          end_time: '10:00',
        })

      expect(conflictResponse.status).toBe(409)
      expect(conflictResponse.body).toEqual({
        success: false,
        message: 'Time slot already exists for this date and time',
      })
    })
  })

  describe('DELETE /time-slots/:slotId', () => {
    test('deletes an owned unbooked time slot', async () => {
      const { user, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })

      const response = await request(app)
        .delete(`/time-slots/${slot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Time slot deleted successfully',
      })

      const dbResult = await pool.query(
        'SELECT id FROM time_slots WHERE id = $1',
        [slot.id],
      )
      expect(dbResult.rows).toHaveLength(0)
    })

    test('returns not found or booked errors for invalid deletes', async () => {
      const { user, provider } = await createProvider()
      const other = await createProvider({
        user: await createUser({
          name: 'Other Provider',
          email: 'other@example.com',
        }),
      })
      const otherSlot = await createSlot({ providerId: other.provider.id })
      const bookedSlot = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        isBooked: true,
      })

      const notFoundResponse = await request(app)
        .delete(`/time-slots/${otherSlot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
      expect(notFoundResponse.status).toBe(404)
      expect(notFoundResponse.body).toEqual({
        success: false,
        message: 'Time slot not found or does not belong to you',
      })

      const bookedResponse = await request(app)
        .delete(`/time-slots/${bookedSlot.id}`)
        .set('Authorization', `Bearer ${tokenFor(user)}`)
      expect(bookedResponse.status).toBe(400)
      expect(bookedResponse.body).toEqual({
        success: false,
        message: 'Cannot delete a booked time slot',
      })
    })
  })

  describe('time slot service', () => {
    test('creates, lists, filters, updates, and deletes slots', async () => {
      const { user, provider } = await createProvider()

      const createdSlot = await createTimeSlot(user.id, {
        slot_date: '2026-06-15',
        start_time: '09:00',
        end_time: '10:00',
        duration: 60,
      })
      await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        isBooked: true,
      })

      const providerSlots = await getProviderTimeSlots(user.id)
      const availableSlots = await getAvailableTimeSlots(
        provider.id,
        '2026-06-15',
        '2026-06-15',
      )
      const updatedSlot = await updateTimeSlot(createdSlot.id, user.id, {
        duration: 45,
      })
      await deleteTimeSlot(createdSlot.id, user.id)

      expect(providerSlots).toHaveLength(2)
      expect(availableSlots).toEqual([
        expect.objectContaining({
          id: createdSlot.id,
          provider_id: provider.id,
          duration: 60,
          specialization: 'General Practice',
          provider_name: user.name,
        }),
      ])
      expect(updatedSlot).toEqual(
        expect.objectContaining({
          id: createdSlot.id,
          duration: 45,
        }),
      )

      const deletedResult = await pool.query(
        'SELECT id FROM time_slots WHERE id = $1',
        [createdSlot.id],
      )
      expect(deletedResult.rows).toHaveLength(0)
    })

    test('maps service error cases to status codes', async () => {
      const { user, provider } = await createProvider()
      const slot = await createSlot({ providerId: provider.id })
      const bookedSlot = await createSlot({
        providerId: provider.id,
        slotDate: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        isBooked: true,
      })

      await expect(
        createTimeSlot(user.id, {
          slot_date: '2026-06-15',
          start_time: '09:00',
          end_time: '10:00',
          duration: 60,
        }),
      ).rejects.toMatchObject({
        message: 'Time slot already exists for this date and time',
        status: 409,
      })
      await expect(updateTimeSlot(slot.id, user.id, {})).rejects.toMatchObject({
        message: 'No fields to update',
        status: 400,
      })
      await expect(
        updateTimeSlot(bookedSlot.id, user.id, { duration: 30 }),
      ).rejects.toMatchObject({
        message: 'Cannot update a booked time slot',
        status: 400,
      })
      await expect(
        deleteTimeSlot(bookedSlot.id, user.id),
      ).rejects.toMatchObject({
        message: 'Cannot delete a booked time slot',
        status: 400,
      })
      await expect(deleteTimeSlot(999, user.id)).rejects.toMatchObject({
        message: 'Time slot not found or does not belong to you',
        status: 404,
      })
    })
  })
})
