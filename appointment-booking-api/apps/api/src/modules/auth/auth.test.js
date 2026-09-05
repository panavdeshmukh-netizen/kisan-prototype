import request from 'supertest'
import jwt from 'jsonwebtoken'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

let app
let pool

const validRegistrationPayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password1',
  role: 'client',
}

const truncateTables = async () => {
  await pool.query(`
    TRUNCATE TABLE appointments, time_slots, service_providers, users
    RESTART IDENTITY CASCADE
  `)
}

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

describe('Auth module', () => {
  describe('POST /auth/register', () => {
    test('registers a client user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationPayload)

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: {
          user: expect.objectContaining({
            id: expect.any(Number),
            name: validRegistrationPayload.name,
            email: validRegistrationPayload.email,
            role: validRegistrationPayload.role,
            created_at: expect.any(String),
          }),
        },
      })

      const dbResult = await pool.query(
        'SELECT email, role, password_hash FROM users WHERE email = $1',
        [validRegistrationPayload.email],
      )

      expect(dbResult.rows).toHaveLength(1)
      expect(dbResult.rows[0].email).toBe(validRegistrationPayload.email)
      expect(dbResult.rows[0].role).toBe(validRegistrationPayload.role)
      expect(dbResult.rows[0].password_hash).not.toBe(
        validRegistrationPayload.password,
      )
    })

    test('registers a provider user and auto-creates provider profile', async () => {
      const providerPayload = {
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'Password1',
        role: 'provider',
      }

      const response = await request(app)
        .post('/auth/register')
        .send(providerPayload)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)

      const providerResult = await pool.query(
        'SELECT * FROM service_providers WHERE user_id = $1',
        [response.body.data.user.id],
      )

      expect(providerResult.rows).toHaveLength(1)
      expect(providerResult.rows[0].user_id).toBe(response.body.data.user.id)
    })

    test('registers a farmer user and auto-creates farmer profile', async () => {
      const farmerPayload = {
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        password: 'Password1',
        role: 'farmer',
        phone: '9876543210',
        village: 'Rampur',
        address: 'House 12, Rampur',
        registrationId: 'FARM-001',
      }

      const response = await request(app)
        .post('/auth/register')
        .send(farmerPayload)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.role).toBe('farmer')

      const farmerResult = await pool.query(
        'SELECT * FROM farmers WHERE user_id = $1',
        [response.body.data.user.id],
      )

      expect(farmerResult.rows).toHaveLength(1)
      expect(farmerResult.rows[0].phone).toBe(farmerPayload.phone)
      expect(farmerResult.rows[0].village).toBe(farmerPayload.village)
      expect(farmerResult.rows[0].registration_id).toBe(
        farmerPayload.registrationId,
      )
    })

    test('rejects farmer registration without a phone number', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'Ramesh Kumar',
        email: 'ramesh2@example.com',
        password: 'Password1',
        role: 'farmer',
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'phone',
            message: 'Phone number is required for farmer registration',
          },
        ]),
      )
    })

    test('returns validation errors for invalid registration data', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: 'weak',
        role: 'admin',
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'name',
            message: 'Name must be at least 2 characters long',
          },
          {
            field: 'email',
            message: 'Must be a valid email address',
          },
          {
            field: 'password',
            message: 'Password must be at least 8 characters long',
          },
          {
            field: 'role',
            message: "Role must be either 'client', 'provider' or 'farmer'",
          },
        ]),
      )
    })

    test('returns a conflict when the email is already registered', async () => {
      await request(app).post('/auth/register').send(validRegistrationPayload)

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationPayload)

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: `User with email ${validRegistrationPayload.email} already exists`,
      })
    })
  })

  describe('POST /auth/login', () => {
    test('logs in a registered user and returns a valid JWT', async () => {
      await request(app).post('/auth/register').send(validRegistrationPayload)

      const response = await request(app).post('/auth/login').send({
        email: validRegistrationPayload.email,
        password: validRegistrationPayload.password,
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          token: expect.any(String),
          user: {
            id: expect.any(Number),
            name: validRegistrationPayload.name,
            email: validRegistrationPayload.email,
            role: validRegistrationPayload.role,
          },
        },
      })

      const decodedToken = jwt.verify(
        response.body.data.token,
        process.env.JWT_SECRET,
      )

      expect(decodedToken).toEqual(
        expect.objectContaining({
          email: validRegistrationPayload.email,
          role: validRegistrationPayload.role,
        }),
      )
      expect(decodedToken.id).toEqual(expect.any(Number))
    })

    test('returns validation errors for invalid login data', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'not-an-email',
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'email',
            message: 'Must be a valid email address',
          },
          {
            field: 'password',
            message: 'Password is required',
          },
        ]),
      )
    })

    test('returns unauthorized for invalid credentials', async () => {
      await request(app).post('/auth/register').send(validRegistrationPayload)

      const response = await request(app).post('/auth/login').send({
        email: validRegistrationPayload.email,
        password: 'WrongPassword1',
      })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      })
    })
  })
})
