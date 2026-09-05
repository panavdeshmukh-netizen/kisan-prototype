import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Get farmer profile by user ID.
 * Used by the procurement/booking modules to resolve the authenticated
 * user (from the JWT) to their farmer profile, instead of trusting a
 * farmerId supplied by the client.
 * @param {number} userId - User ID (from req.user.id)
 * @returns {Promise<Object>} - Farmer profile with basic user details
 */
export const getFarmerByUserId = async (userId) => {
  try {
    const query = `
      SELECT
        f.id,
        f.user_id,
        f.registration_id,
        f.name,
        f.phone,
        f.village,
        f.address,
        f.created_at,
        u.email,
        u.role
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = $1
    `
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      const error = new Error('Farmer profile not found')
      error.status = 404
      throw error
    }

    logger.debug(`Farmer retrieved: user_id=${userId}`)
    return result.rows[0]
  } catch (error) {
    logger.error('Error getting farmer by user ID', {
      userId,
      error: error.message,
    })
    throw error
  }
}
