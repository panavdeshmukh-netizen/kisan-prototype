import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Get usable procurement slots for a centre on a given date.
 * "Usable" means status = 'open' (i.e. not full, not closed) — slots that
 * are already full or manually closed are excluded from the farmer-facing list.
 * @param {number} centreId - Procurement centre ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Array>} - List of available slots
 */
export const getAvailableSlots = async (centreId, date) => {
  try {
    const query = `
      SELECT
        id,
        centre_id,
        slot_date,
        start_time,
        end_time,
        capacity,
        booked_count,
        (capacity - booked_count) AS available_capacity,
        status
      FROM procurement_slots
      WHERE centre_id = $1
        AND slot_date = $2
        AND status = 'open'
      ORDER BY start_time ASC
    `
    const result = await pool.query(query, [centreId, date])

    logger.debug(
      `Retrieved ${result.rows.length} available slots for centre_id=${centreId}, date=${date}`,
    )
    return result.rows
  } catch (error) {
    logger.error('Error getting available procurement slots', {
      centreId,
      date,
      error: error.message,
    })
    throw error
  }
}
