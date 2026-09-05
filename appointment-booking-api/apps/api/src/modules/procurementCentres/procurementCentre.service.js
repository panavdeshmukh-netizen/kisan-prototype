import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Get all active procurement centres
 * @returns {Promise<Array>} - List of active procurement centres
 */
export const getActiveCentres = async () => {
  try {
    const query = `
      SELECT id, name, location, district, capacity, active, created_at
      FROM procurement_centres
      WHERE active = true
      ORDER BY name ASC
    `
    const result = await pool.query(query)

    logger.debug(`Retrieved ${result.rows.length} active procurement centres`)
    return result.rows
  } catch (error) {
    logger.error('Error getting active procurement centres', {
      error: error.message,
    })
    throw error
  }
}

/**
 * Get a single procurement centre by ID
 * @param {number} centreId - Procurement centre ID
 * @returns {Promise<Object|null>} - Procurement centre or null if not found
 */
export const getCentreById = async (centreId) => {
  try {
    const query = `
      SELECT id, name, location, district, capacity, active, created_at
      FROM procurement_centres
      WHERE id = $1
    `
    const result = await pool.query(query, [centreId])
    return result.rows[0] || null
  } catch (error) {
    logger.error('Error getting procurement centre by ID', {
      centreId,
      error: error.message,
    })
    throw error
  }
}
