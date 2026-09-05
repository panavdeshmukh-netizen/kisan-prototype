import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'
import { getProviderByUserId } from '../providers/provider.service.js'

/**
 * Create a time slot for a provider
 * @param {number} userId - User ID of the provider
 * @param {Object} slotData - Time slot data
 * @param {string} slotData.slot_date - Date (YYYY-MM-DD)
 * @param {string} slotData.start_time - Start time (HH:MM)
 * @param {string} slotData.end_time - End time (HH:MM)
 * @param {number} slotData.duration - Duration in minutes
 * @returns {Promise<Object>} - Created time slot
 */
export const createTimeSlot = async (
  userId,
  { slot_date, start_time, end_time, duration },
) => {
  try {
    // Get provider ID from user ID
    const provider = await getProviderByUserId(userId)

    const query = `
      INSERT INTO time_slots (provider_id, slot_date, start_time, end_time, duration)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, provider_id, slot_date, start_time, end_time, duration, is_booked, created_at
    `

    const result = await pool.query(query, [
      provider.id,
      slot_date,
      start_time,
      end_time,
      duration,
    ])

    logger.info(
      `Time slot created: provider_id=${provider.id}, date=${slot_date}, time=${start_time}`,
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      logger.warn(`Duplicate time slot: date=${slot_date}, time=${start_time}`)
      const err = new Error('Time slot already exists for this date and time')
      err.status = 409
      throw err
    }
    logger.error('Error creating time slot', { userId, error: error.message })
    throw error
  }
}

/**
 * Get all time slots for a provider
 * @param {number} userId - User ID of the provider
 * @returns {Promise<Array>} - List of time slots
 */
export const getProviderTimeSlots = async (userId) => {
  try {
    const provider = await getProviderByUserId(userId)

    const query = `
      SELECT 
        id, 
        provider_id, 
        slot_date, 
        start_time, 
        end_time, 
        duration, 
        is_booked, 
        created_at
      FROM time_slots
      WHERE provider_id = $1
      ORDER BY slot_date ASC, start_time ASC
    `

    const result = await pool.query(query, [provider.id])

    logger.debug(
      `Retrieved ${result.rows.length} time slots for provider_id=${provider.id}`,
    )
    return result.rows
  } catch (error) {
    logger.error('Error getting provider time slots', {
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Get available time slots for a specific provider
 * @param {number} providerId - Provider ID
 * @param {string} startDate - Start date (YYYY-MM-DD) optional
 * @param {string} endDate - End date (YYYY-MM-DD) optional
 * @returns {Promise<Array>} - List of available time slots
 */
export const getAvailableTimeSlots = async (
  providerId,
  startDate = null,
  endDate = null,
) => {
  try {
    let query = `
      SELECT 
        ts.id, 
        ts.provider_id, 
        ts.slot_date, 
        ts.start_time, 
        ts.end_time, 
        ts.duration,
        sp.specialization,
        u.name as provider_name
      FROM time_slots ts
      JOIN service_providers sp ON ts.provider_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE ts.provider_id = $1 
        AND ts.is_booked = false
    `

    const values = [providerId]
    let paramCount = 2

    if (startDate) {
      query += ` AND ts.slot_date >= $${paramCount++}`
      values.push(startDate)
    }

    if (endDate) {
      query += ` AND ts.slot_date <= $${paramCount++}`
      values.push(endDate)
    }

    query += ` ORDER BY ts.slot_date ASC, ts.start_time ASC`

    const result = await pool.query(query, values)

    logger.debug(
      `Retrieved ${result.rows.length} available slots for provider_id=${providerId}`,
    )
    return result.rows
  } catch (error) {
    logger.error('Error getting available time slots', {
      providerId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Update a time slot
 * @param {number} slotId - Time slot ID
 * @param {number} userId - User ID of the provider (for authorization)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated time slot
 */
export const updateTimeSlot = async (
  slotId,
  userId,
  { slot_date, start_time, end_time, duration },
) => {
  try {
    const provider = await getProviderByUserId(userId)

    // Check if slot belongs to this provider and is not booked
    const checkQuery = `
      SELECT id, is_booked 
      FROM time_slots 
      WHERE id = $1 AND provider_id = $2
    `
    const checkResult = await pool.query(checkQuery, [slotId, provider.id])

    if (checkResult.rows.length === 0) {
      const error = new Error('Time slot not found or does not belong to you')
      error.status = 404
      throw error
    }

    if (checkResult.rows[0].is_booked) {
      const error = new Error('Cannot update a booked time slot')
      error.status = 400
      throw error
    }

    const updates = []
    const values = []
    let paramCount = 1

    if (slot_date !== undefined) {
      updates.push(`slot_date = $${paramCount++}`)
      values.push(slot_date)
    }

    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`)
      values.push(start_time)
    }

    if (end_time !== undefined) {
      updates.push(`end_time = $${paramCount++}`)
      values.push(end_time)
    }

    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`)
      values.push(duration)
    }

    if (updates.length === 0) {
      const error = new Error('No fields to update')
      error.status = 400
      throw error
    }

    values.push(slotId, provider.id)

    const query = `
      UPDATE time_slots 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND provider_id = $${paramCount}
      RETURNING id, provider_id, slot_date, start_time, end_time, duration, is_booked, created_at
    `

    const result = await pool.query(query, values)

    logger.info(`Time slot updated: id=${slotId}`)
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      logger.warn(`Duplicate time slot on update: id=${slotId}`)
      const err = new Error('Time slot already exists for this date and time')
      err.status = 409
      throw err
    }
    logger.error('Error updating time slot', { slotId, error: error.message })
    throw error
  }
}

/**
 * Delete a time slot
 * @param {number} slotId - Time slot ID
 * @param {number} userId - User ID of the provider (for authorization)
 * @returns {Promise<void>}
 */
export const deleteTimeSlot = async (slotId, userId) => {
  try {
    const provider = await getProviderByUserId(userId)

    // Check if slot is booked
    const checkQuery = `
      SELECT id, is_booked 
      FROM time_slots 
      WHERE id = $1 AND provider_id = $2
    `
    const checkResult = await pool.query(checkQuery, [slotId, provider.id])

    if (checkResult.rows.length === 0) {
      const error = new Error('Time slot not found or does not belong to you')
      error.status = 404
      throw error
    }

    if (checkResult.rows[0].is_booked) {
      const error = new Error('Cannot delete a booked time slot')
      error.status = 400
      throw error
    }

    const deleteQuery = `
      DELETE FROM time_slots 
      WHERE id = $1 AND provider_id = $2
    `

    await pool.query(deleteQuery, [slotId, provider.id])

    logger.info(`Time slot deleted: id=${slotId}`)
  } catch (error) {
    logger.error('Error deleting time slot', { slotId, error: error.message })
    throw error
  }
}
