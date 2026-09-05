import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Get provider profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Provider profile with user details
 */
export const getProviderByUserId = async (userId) => {
  try {
    const query = `
      SELECT 
        sp.id, 
        sp.user_id, 
        sp.specialization, 
        sp.description, 
        sp.created_at,
        u.name, 
        u.email, 
        u.role
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = $1
    `
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      const error = new Error('Provider profile not found')
      error.status = 404
      throw error
    }

    logger.debug(`Provider retrieved: user_id=${userId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error getting provider by user ID', {
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Get provider by provider ID
 * @param {number} providerId - Provider ID
 * @returns {Promise<Object>} - Provider profile with user details
 */
export const getProviderById = async (providerId) => {
  try {
    const query = `
      SELECT 
        sp.id, 
        sp.user_id, 
        sp.specialization, 
        sp.description, 
        sp.created_at,
        u.name, 
        u.email
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `
    const result = await pool.query(query, [providerId])

    if (result.rows.length === 0) {
      const error = new Error('Provider not found')
      error.status = 404
      throw error
    }

    logger.debug(`Provider retrieved: id=${providerId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error getting provider by ID', {
      providerId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Get all service providers
 * @returns {Promise<Array>} - List of all providers
 */
export const getAllProviders = async () => {
  try {
    const query = `
      SELECT 
        sp.id, 
        sp.specialization, 
        sp.description,
        u.name, 
        u.email
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      ORDER BY u.name ASC
    `
    const result = await pool.query(query)

    logger.debug(`Retrieved ${result.rows.length} providers`)
    return result.rows
  } catch (error) {
    logger.error('Error getting all providers', { error: error.message })
    throw error
  }
}

/**
 * Update provider profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.specialization - Provider specialization
 * @param {string} updateData.description - Provider description
 * @returns {Promise<Object>} - Updated provider profile
 */
export const updateProviderProfile = async (
  userId,
  { specialization, description },
) => {
  try {
    const updates = []
    const values = []
    let paramCount = 1

    if (specialization !== undefined) {
      updates.push(`specialization = $${paramCount++}`)
      values.push(specialization)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }

    if (updates.length === 0) {
      const error = new Error('No fields to update')
      error.status = 400
      throw error
    }

    values.push(userId)

    const query = `
      UPDATE service_providers 
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING id, user_id, specialization, description, created_at
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      const error = new Error('Provider profile not found')
      error.status = 404
      throw error
    }

    logger.info(`Provider profile updated: user_id=${userId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error updating provider profile', {
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Create provider profile for existing user
 * @param {number} userId - User ID
 * @param {Object} providerData - Provider data
 * @param {string} providerData.specialization - Provider specialization
 * @param {string} providerData.description - Provider description
 * @returns {Promise<Object>} - Created provider profile
 */
export const createProviderProfile = async (
  userId,
  { specialization, description },
) => {
  try {
    const query = `
      INSERT INTO service_providers (user_id, specialization, description)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, specialization, description, created_at
    `

    const result = await pool.query(query, [
      userId,
      specialization,
      description,
    ])

    logger.info(`Provider profile created: user_id=${userId}`)
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      logger.warn(`Provider profile already exists for user_id=${userId}`)
      const err = new Error('Provider profile already exists for this user')
      err.status = 409
      throw err
    }
    logger.error('Error creating provider profile', {
      userId,
      error: error.message,
    })
    throw error
  }
}
