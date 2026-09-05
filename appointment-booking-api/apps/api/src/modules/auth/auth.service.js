import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'
import bcrypt from 'bcryptjs'

/**
 * Check if a user with the given email already exists
 * @param {string} email - User email
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
const userExists = async (email) => {
  const query = 'SELECT email FROM users WHERE email = $1'
  const result = await pool.query(query, [email])
  return result.rows.length > 0
}

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.HASH_SALT, 10) || 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Create a new user in the database
 * @param {Object} userData - User data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - Plain text password
 * @param {string} userData.role - User's role (client, provider or farmer)
 * @param {string} [userData.phone] - Farmer phone (required when role === 'farmer')
 * @param {string} [userData.village] - Farmer village (role === 'farmer' only)
 * @param {string} [userData.address] - Farmer address (role === 'farmer' only)
 * @param {string} [userData.registrationId] - Farmer registration ID (role === 'farmer' only)
 * @returns {Promise<Object>} - Created user object
 */
export const createUser = async ({
  name,
  email,
  password,
  role,
  phone,
  village,
  address,
  registrationId,
}) => {
  // Check if user already exists before opening transaction client
  const exists = await userExists(email)
  if (exists) {
    logger.warn(
      `Registration failed: User with email already exists - ${email}`,
    )
    const error = new Error(`User with email ${email} already exists`)
    error.status = 409
    throw error
  }

  // Hash the password
  const hashedPassword = await hashPassword(password)
  logger.debug(`Password hashed for email - ${email}`)

  const client = await pool.connect()
  let inTransaction = false
  try {
    await client.query('BEGIN')
    inTransaction = true

    // Insert user into database
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role, created_at
    `

    const result = await client.query(insertQuery, [
      name,
      email,
      hashedPassword,
      role,
    ])

    const newUser = result.rows[0]

    // If registered as provider, automatically create initial service_provider profile
    if (role === 'provider') {
      await client.query(
        `INSERT INTO service_providers (user_id) VALUES ($1)`,
        [newUser.id],
      )
      logger.info(`Initialized provider profile for user ID=${newUser.id}`)
    }

    // If registered as farmer, automatically create the corresponding
    // farmers profile row (same transaction as the users insert above).
    if (role === 'farmer') {
      await client.query(
        `INSERT INTO farmers (user_id, registration_id, name, phone, village, address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newUser.id,
          registrationId || null,
          name,
          phone,
          village || null,
          address || null,
        ],
      )
      logger.info(`Initialized farmer profile for user ID=${newUser.id}`)
    }

    await client.query('COMMIT')
    inTransaction = false

    logger.info(
      `User registered successfully: ID=${newUser.id}, Role=${newUser.role}`,
    )

    return newUser
  } catch (error) {
    if (inTransaction) {
      await client.query('ROLLBACK')
    }
    if (error.code === '23505') {
      if (error.constraint === 'farmers_registration_id_key') {
        logger.warn(`Unique violation on farmer registration_id: ${email}`)
        const err = new Error('Registration ID is already in use')
        err.status = 409
        throw err
      }
      logger.warn(`Unique violation during registration: ${email}`)
      const err = new Error(`User with email ${email} already exists`)
      err.status = 409
      throw err
    }
    logger.error('Error creating user', { email, error: error.message })
    throw error
  } finally {
    client.release()
  }
}

/**
 * Authenticate user credentials
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} - Authenticated user object
 */
export const authenticateUser = async (email, password) => {
  try {
    const query =
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1'
    const result = await pool.query(query, [email])

    if (result.rows.length === 0) {
      logger.warn(`Authentication failed: No user found with email - ${email}`)
      const error = new Error('Invalid email or password')
      error.status = 401
      throw error
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      logger.warn(
        `Authentication failed: Incorrect password for email - ${email}`,
      )
      const error = new Error('Invalid email or password')
      error.status = 401
      throw error
    }

    logger.info(
      `User authenticated successfully: ID=${user.id}, Email=${user.email}`,
    )
    delete user.password_hash // Remove password hash before returning user object
    return user
  } catch (error) {
    logger.error('Error authenticating user', { email, error: error.message })
    throw error
  }
}
