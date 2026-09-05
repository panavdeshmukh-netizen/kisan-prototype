import request from 'supertest'
import jwt from 'jsonwebtoken'
import {
  createProviderProfile,
  getProviderById,
  getProviderByUserId,
  updateProviderProfile,
} from './provider.service.js'

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

describe('Provider module', () => {
  describe('GET /providers', () => {
    test('returns all providers for an authenticated user', async () => {
      const first = await createProvider({
        user: await createUser({
          name: 'Dr. Zoe Carter',
          email: 'zoe@example.com',
        }),
        specialization: 'Dermatology',
        description: 'Skin care specialist',
      })
      const second = await createProvider({
        user: await createUser({
          name: 'Dr. Aaron Patel',
          email: 'aaron@example.com',
        }),
        specialization: 'Cardiology',
        description: 'Heart care specialist',
      })

      const response = await request(app)
        .get('/providers')
        .set('Authorization', `Bearer ${tokenFor(first.user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Providers retrieved successfully',
        count: 2,
        data: [
          expect.objectContaining({
            id: second.provider.id,
            name: second.user.name,
            email: second.user.email,
            specialization: second.provider.specialization,
            description: second.provider.description,
          }),
          expect.objectContaining({
            id: first.provider.id,
            name: first.user.name,
            email: first.user.email,
            specialization: first.provider.specialization,
            description: first.provider.description,
          }),
        ],
      })
    })

    test('returns unauthorized without a token', async () => {
      const response = await request(app).get('/providers')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        message: 'Access denied. No token provided.',
      })
    })
  })

  describe('GET /providers/profile', () => {
    test('returns the authenticated provider profile', async () => {
      const { user, provider } = await createProvider({
        specialization: 'Pediatrics',
        description: 'Child health services',
      })

      const response = await request(app)
        .get('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Provider profile retrieved successfully',
        data: {
          provider: expect.objectContaining({
            id: provider.id,
            user_id: user.id,
            name: user.name,
            email: user.email,
            role: 'provider',
            specialization: provider.specialization,
            description: provider.description,
            created_at: expect.any(String),
          }),
        },
      })
    })

    test('returns forbidden for non-provider users', async () => {
      const client = await createUser({
        name: 'Client User',
        email: 'client@example.com',
        role: 'client',
      })

      const response = await request(app)
        .get('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(client)}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        message: 'Access denied. Required role: provider',
      })
    })

    test('returns not found when the provider profile is missing', async () => {
      const user = await createUser()

      const response = await request(app)
        .get('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Provider profile not found',
      })
    })
  })

  describe('PUT /providers/profile', () => {
    test('updates the authenticated provider profile', async () => {
      const { user, provider } = await createProvider()

      const response = await request(app)
        .put('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          specialization: 'Sports Medicine',
          description: 'Injury prevention and recovery',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Provider profile updated successfully',
        data: {
          provider: expect.objectContaining({
            id: provider.id,
            user_id: user.id,
            specialization: 'Sports Medicine',
            description: 'Injury prevention and recovery',
            created_at: expect.any(String),
          }),
        },
      })

      const dbResult = await pool.query(
        'SELECT specialization, description FROM service_providers WHERE user_id = $1',
        [user.id],
      )

      expect(dbResult.rows[0]).toEqual({
        specialization: 'Sports Medicine',
        description: 'Injury prevention and recovery',
      })
    })

    test('allows updating a single provider profile field', async () => {
      const { user } = await createProvider({
        specialization: 'Family Medicine',
        description: 'Whole-family care',
      })

      const response = await request(app)
        .put('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ description: 'Preventive care and wellness' })

      expect(response.status).toBe(200)
      expect(response.body.data.provider).toEqual(
        expect.objectContaining({
          specialization: 'Family Medicine',
          description: 'Preventive care and wellness',
        }),
      )
    })

    test('returns validation errors for empty or oversized updates', async () => {
      const { user } = await createProvider()

      const emptyResponse = await request(app)
        .put('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({})

      expect(emptyResponse.status).toBe(400)
      expect(emptyResponse.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: undefined,
            message:
              'At least one field (specialization or description) must be provided',
          },
        ],
      })

      const oversizedResponse = await request(app)
        .put('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          specialization: 'x'.repeat(101),
          description: 'y'.repeat(1001),
        })

      expect(oversizedResponse.status).toBe(400)
      expect(oversizedResponse.body.success).toBe(false)
      expect(oversizedResponse.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'specialization',
            message: 'Specialization must not exceed 100 characters',
          },
          {
            field: 'description',
            message: 'Description must not exceed 1000 characters',
          },
        ]),
      )
    })

    test('returns not found when updating a missing provider profile', async () => {
      const user = await createUser()

      const response = await request(app)
        .put('/providers/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ specialization: 'Neurology' })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Provider profile not found',
      })
    })
  })

  describe('provider service', () => {
    test('creates and retrieves provider profiles', async () => {
      const user = await createUser()

      const createdProvider = await createProviderProfile(user.id, {
        specialization: 'Dentistry',
        description: 'Preventive dental care',
      })
      const byUserId = await getProviderByUserId(user.id)
      const byProviderId = await getProviderById(createdProvider.id)

      expect(createdProvider).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          user_id: user.id,
          specialization: 'Dentistry',
          description: 'Preventive dental care',
          created_at: expect.any(Date),
        }),
      )
      expect(byUserId).toEqual(
        expect.objectContaining({
          id: createdProvider.id,
          user_id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }),
      )
      expect(byProviderId).toEqual(
        expect.objectContaining({
          id: createdProvider.id,
          user_id: user.id,
          name: user.name,
          email: user.email,
        }),
      )
    })

    test('maps provider service errors to status codes', async () => {
      const user = await createUser()
      await createProviderProfile(user.id, {
        specialization: 'Oncology',
        description: 'Cancer care',
      })

      await expect(getProviderById(999)).rejects.toMatchObject({
        message: 'Provider not found',
        status: 404,
      })
      await expect(updateProviderProfile(user.id, {})).rejects.toMatchObject({
        message: 'No fields to update',
        status: 400,
      })
      await expect(
        createProviderProfile(user.id, {
          specialization: 'Duplicate',
          description: 'Duplicate profile',
        }),
      ).rejects.toMatchObject({
        message: 'Provider profile already exists for this user',
        status: 409,
      })
    })
  })
})
