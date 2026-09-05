import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  deleteUser,
  getUserById,
  updateUserPassword,
  updateUserProfile,
} from './user.service.js'

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
  name = 'Jane Doe',
  email = 'jane@example.com',
  password = 'Password1',
  role = 'client',
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 4)
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, passwordHash, role],
  )

  return { ...result.rows[0], password }
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

describe('User module', () => {
  describe('GET /users/profile', () => {
    test('returns the authenticated user profile without the password hash', async () => {
      const user = await createUser()

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: expect.any(String),
          },
        },
      })
      expect(response.body.data.user.password_hash).toBeUndefined()
    })

    test('returns unauthorized without a token and includes security headers', async () => {
      const response = await request(app).get('/users/profile')

      expect(response.status).toBe(401)
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.body).toEqual({
        message: 'Access denied. No token provided.',
      })
    })

    test('returns not found when the authenticated user no longer exists', async () => {
      const missingUser = {
        id: 999,
        email: 'missing@example.com',
        role: 'client',
      }

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(missingUser)}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'User not found',
      })
    })
  })

  describe('PUT /users/profile', () => {
    test('updates the authenticated user profile', async () => {
      const user = await createUser()

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: expect.objectContaining({
            id: user.id,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: user.role,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }),
        },
      })

      const dbResult = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [user.id],
      )

      expect(dbResult.rows[0]).toEqual({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      })
    })

    test('allows updating a single profile field', async () => {
      const user = await createUser({ name: 'Original Name' })

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ name: 'Updated Name' })

      expect(response.status).toBe(200)
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          name: 'Updated Name',
          email: user.email,
        }),
      )
    })

    test('returns validation errors for invalid profile updates', async () => {
      const user = await createUser()

      const emptyResponse = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({})

      expect(emptyResponse.status).toBe(400)
      expect(emptyResponse.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: undefined,
            message: 'At least one field (name or email) must be provided',
          },
        ],
      })

      const invalidResponse = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          name: 'A',
          email: 'not-an-email',
        })

      expect(invalidResponse.status).toBe(400)
      expect(invalidResponse.body.success).toBe(false)
      expect(invalidResponse.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'name',
            message: 'Name must be at least 2 characters long',
          },
          {
            field: 'email',
            message: 'Must be a valid email address',
          },
        ]),
      )
    })

    test('returns a conflict when the new email belongs to another user', async () => {
      const user = await createUser()
      const otherUser = await createUser({
        email: 'taken@example.com',
      })

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({ email: otherUser.email })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Email already in use by another account',
      })
    })
  })

  describe('PUT /users/password', () => {
    test("changes the authenticated user's password", async () => {
      const user = await createUser()

      const response = await request(app)
        .put('/users/password')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          oldPassword: user.password,
          newPassword: 'NewPassword1',
          confirmPassword: 'NewPassword1',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Password updated successfully',
      })

      const dbResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id],
      )

      await expect(
        bcrypt.compare('NewPassword1', dbResult.rows[0].password_hash),
      ).resolves.toBe(true)
    })

    test('returns validation errors for invalid password changes', async () => {
      const user = await createUser()

      const response = await request(app)
        .put('/users/password')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          oldPassword: '',
          newPassword: 'weak',
          confirmPassword: 'different',
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          {
            field: 'oldPassword',
            message: 'Current password is required',
          },
          {
            field: 'newPassword',
            message: 'New password must be at least 8 characters long',
          },
          {
            field: 'confirmPassword',
            message: 'Passwords do not match',
          },
        ]),
      )
    })

    test('returns unauthorized when the current password is incorrect', async () => {
      const user = await createUser()

      const response = await request(app)
        .put('/users/password')
        .set('Authorization', `Bearer ${tokenFor(user)}`)
        .send({
          oldPassword: 'WrongPassword1',
          newPassword: 'NewPassword1',
          confirmPassword: 'NewPassword1',
        })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Current password is incorrect',
      })
    })
  })

  describe('DELETE /users/profile', () => {
    test('deletes the authenticated user account', async () => {
      const user = await createUser()

      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(user)}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: 'Account deleted successfully',
      })

      const dbResult = await pool.query('SELECT id FROM users WHERE id = $1', [
        user.id,
      ])

      expect(dbResult.rows).toHaveLength(0)
    })

    test('returns not found when deleting a missing user', async () => {
      const missingUser = {
        id: 999,
        email: 'missing@example.com',
        role: 'client',
      }

      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', `Bearer ${tokenFor(missingUser)}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'User not found',
      })
    })
  })

  describe('user service', () => {
    test('retrieves and updates user profile data', async () => {
      const user = await createUser()

      const foundUser = await getUserById(user.id)
      const updatedUser = await updateUserProfile(user.id, {
        name: 'Service User',
        email: 'service@example.com',
      })

      expect(foundUser).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: expect.any(Date),
      })
      expect(foundUser.password_hash).toBeUndefined()
      expect(updatedUser).toEqual(
        expect.objectContaining({
          id: user.id,
          name: 'Service User',
          email: 'service@example.com',
          role: user.role,
          updated_at: expect.any(Date),
        }),
      )
    })

    test('maps user service errors to status codes', async () => {
      const user = await createUser()
      const otherUser = await createUser({ email: 'other@example.com' })

      await expect(getUserById(999)).rejects.toMatchObject({
        message: 'User not found',
        status: 404,
      })
      await expect(updateUserProfile(user.id, {})).rejects.toMatchObject({
        message: 'No fields to update',
        status: 400,
      })
      await expect(
        updateUserProfile(user.id, { email: otherUser.email }),
      ).rejects.toMatchObject({
        message: 'Email already in use by another account',
        status: 409,
      })
      await expect(
        updateUserPassword(user.id, 'WrongPassword1', 'NewPassword1'),
      ).rejects.toMatchObject({
        message: 'Current password is incorrect',
        status: 401,
      })
      await expect(deleteUser(999)).rejects.toMatchObject({
        message: 'User not found',
        status: 404,
      })
    })
  })
})
