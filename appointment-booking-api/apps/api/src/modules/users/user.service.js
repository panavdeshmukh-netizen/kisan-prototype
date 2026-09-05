import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'
import bcrypt from 'bcryptjs'

const HASH_SALT = parseInt(process.env.HASH_SALT, 10) || 10

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User object without password
 */
export const getUserById = async (userId) => {
  try {
    const query =
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1'
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    logger.debug(`User retrieved: ID=${userId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error getting user by ID', { userId, error: error.message })
    throw error
  }
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.name - New name
 * @param {string} updateData.email - New email
 * @returns {Promise<Object>} - Updated user object
 */
export const updateUserProfile = async (userId, { name, email }) => {
  try {
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId],
      )

      if (emailCheck.rows.length > 0) {
        logger.warn(`Profile update failed: Email ${email} already in use`)
        const error = new Error('Email already in use by another account')
        error.status = 409
        throw error
      }
    }

    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`)
      values.push(email)
    }

    if (updates.length === 0) {
      const error = new Error('No fields to update')
      error.status = 400
      throw error
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(userId)

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, created_at, updated_at
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    logger.info(`User profile updated: ID=${userId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error updating user profile', {
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (userId, oldPassword, newPassword) => {
  try {
    // Get current password hash
    const query = 'SELECT password_hash FROM users WHERE id = $1'
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Verify old password
    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash)

    if (!passwordMatch) {
      logger.warn(
        `Password update failed: Incorrect old password for user ID=${userId}`,
      )
      const error = new Error('Current password is incorrect')
      error.status = 401
      throw error
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, HASH_SALT)

    // Update password
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `

    await pool.query(updateQuery, [hashedPassword, userId])

    logger.info(`Password updated successfully for user ID=${userId}`)
  } catch (error) {
    logger.error('Error updating password', { userId, error: error.message })
    throw error
  }
}

/**
 * Delete user account
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id'
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    logger.info(`User deleted: ID=${userId}`)
  } catch (error) {
    logger.error('Error deleting user', { userId, error: error.message })
    throw error
  }
}
