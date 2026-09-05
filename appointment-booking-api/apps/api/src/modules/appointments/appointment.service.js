import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Book a time slot for a client
 * @param {number} clientId - User ID of the client
 * @param {number} timeSlotId - Time slot ID to book
 * @returns {Object} Created appointment data with provider and slot info
 */
export const bookAppointment = async (clientId, timeSlotId) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Check if time slot exists and lock the row for update to prevent concurrent double-booking
    const slotResult = await client.query(
      `SELECT ts.*, sp.user_id as provider_user_id
       FROM time_slots ts
       JOIN service_providers sp ON ts.provider_id = sp.id
       WHERE ts.id = $1
       FOR UPDATE`,
      [timeSlotId],
    )

    if (slotResult.rows.length === 0) {
      const error = new Error('Time slot not found')
      error.status = 404
      throw error
    }

    const slot = slotResult.rows[0]

    if (slot.is_booked) {
      const error = new Error('Time slot is already booked')
      error.status = 400
      throw error
    }

    // Check if appointment already exists for this slot
    const existingAppointment = await client.query(
      'SELECT id FROM appointments WHERE time_slot_id = $1',
      [timeSlotId],
    )

    if (existingAppointment.rows.length > 0) {
      const error = new Error('Appointment already exists for this time slot')
      error.status = 400
      throw error
    }

    // Create appointment
    const appointmentResult = await client.query(
      `INSERT INTO appointments (client_id, provider_id, time_slot_id, status)
       VALUES ($1, $2, $3, 'booked')
       RETURNING *`,
      [clientId, slot.provider_id, timeSlotId],
    )

    // Mark time slot as booked
    await client.query('UPDATE time_slots SET is_booked = true WHERE id = $1', [
      timeSlotId,
    ])

    await client.query('COMMIT')

    // Get complete appointment details
    const appointment = await getAppointmentById(appointmentResult.rows[0].id)

    logger.info(`Appointment ${appointment.id} created for client ${clientId}`)
    return appointment
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      const err = new Error('Time slot is already booked')
      err.status = 409
      throw err
    }
    logger.error('Error booking appointment:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get appointment by ID with full details
 * @param {number} appointmentId - Appointment ID
 * @returns {Object} Appointment with client, provider, and slot details
 */
export const getAppointmentById = async (appointmentId) => {
  const result = await pool.query(
    `SELECT 
      a.*,
      u.name as client_name,
      u.email as client_email,
      sp.id as provider_id,
      sp.specialization,
      pu.name as provider_name,
      pu.id as provider_user_id,
      ts.slot_date,
      ts.start_time,
      ts.end_time,
      ts.duration
    FROM appointments a
    JOIN users u ON a.client_id = u.id
    JOIN service_providers sp ON a.provider_id = sp.id
    JOIN users pu ON sp.user_id = pu.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.id = $1`,
    [appointmentId],
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

/**
 * Get all appointments for a client
 * @param {number} clientId - User ID of the client
 * @param {string} status - Filter by status (optional)
 * @returns {Array} List of appointments
 */
export const getClientAppointments = async (clientId, status = null) => {
  let query = `
    SELECT 
      a.*,
      sp.specialization,
      pu.name as provider_name,
      pu.id as provider_user_id,
      ts.slot_date,
      ts.start_time,
      ts.end_time,
      ts.duration
    FROM appointments a
    JOIN service_providers sp ON a.provider_id = sp.id
    JOIN users pu ON sp.user_id = pu.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.client_id = $1
  `

  const params = [clientId]

  if (status) {
    query += ' AND a.status = $2'
    params.push(status)
  }

  query += ' ORDER BY ts.slot_date DESC, ts.start_time DESC'

  const result = await pool.query(query, params)

  logger.info(
    `Retrieved ${result.rows.length} appointments for client ${clientId}`,
  )
  return result.rows
}

/**
 * Get all appointments for a provider
 * @param {number} providerId - Service provider ID
 * @param {string} status - Filter by status (optional)
 * @returns {Array} List of appointments
 */
export const getProviderAppointments = async (providerId, status = null) => {
  let query = `
    SELECT 
      a.*,
      u.name as client_name,
      u.email as client_email,
      ts.slot_date,
      ts.start_time,
      ts.end_time,
      ts.duration
    FROM appointments a
    JOIN users u ON a.client_id = u.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.provider_id = $1
  `

  const params = [providerId]

  if (status) {
    query += ' AND a.status = $2'
    params.push(status)
  }

  query += ' ORDER BY ts.slot_date DESC, ts.start_time DESC'

  const result = await pool.query(query, params)

  logger.info(
    `Retrieved ${result.rows.length} appointments for provider ${providerId}`,
  )
  return result.rows
}

/**
 * Cancel an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {number} userId - User ID requesting cancellation
 * @param {string} userRole - Role of the user (client or provider)
 * @returns {Object} Updated appointment data
 */
export const cancelAppointment = async (appointmentId, userId, userRole) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Get appointment details
    const appointmentResult = await client.query(
      `SELECT a.*, sp.user_id as provider_user_id
       FROM appointments a
       JOIN service_providers sp ON a.provider_id = sp.id
       WHERE a.id = $1`,
      [appointmentId],
    )

    if (appointmentResult.rows.length === 0) {
      const error = new Error('Appointment not found')
      error.status = 404
      throw error
    }

    const appointment = appointmentResult.rows[0]

    // Verify user is authorized to cancel
    const isClient = userRole === 'client' && appointment.client_id === userId
    const isProvider =
      userRole === 'provider' && appointment.provider_user_id === userId

    if (!isClient && !isProvider) {
      const error = new Error('Not authorized to cancel this appointment')
      error.status = 403
      throw error
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      const error = new Error('Appointment is already cancelled')
      error.status = 400
      throw error
    }

    // Check if already completed
    if (appointment.status === 'completed') {
      const error = new Error('Cannot cancel a completed appointment')
      error.status = 400
      throw error
    }

    // Update appointment status
    await client.query(
      `UPDATE appointments 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [appointmentId],
    )

    // Make time slot available again
    await client.query(
      'UPDATE time_slots SET is_booked = false WHERE id = $1',
      [appointment.time_slot_id],
    )

    await client.query('COMMIT')

    // Get updated appointment details
    const updatedAppointment = await getAppointmentById(appointmentId)

    logger.info(
      `Appointment ${appointmentId} cancelled by ${userRole} ${userId}`,
    )
    return updatedAppointment
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error cancelling appointment:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Mark an appointment as completed (provider only)
 * @param {number} appointmentId - Appointment ID
 * @param {number} providerUserId - Provider user ID
 * @returns {Object} Updated appointment data
 */
export const completeAppointment = async (appointmentId, providerUserId) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Get appointment and verify provider
    const appointmentResult = await client.query(
      `SELECT a.*, sp.user_id as provider_user_id
       FROM appointments a
       JOIN service_providers sp ON a.provider_id = sp.id
       WHERE a.id = $1`,
      [appointmentId],
    )

    if (appointmentResult.rows.length === 0) {
      const error = new Error('Appointment not found')
      error.status = 404
      throw error
    }

    const appointment = appointmentResult.rows[0]

    // Verify provider authorization
    if (appointment.provider_user_id !== providerUserId) {
      const error = new Error('Not authorized to complete this appointment')
      error.status = 403
      throw error
    }

    // Check if already completed or cancelled
    if (appointment.status === 'completed') {
      const error = new Error('Appointment is already marked as completed')
      error.status = 400
      throw error
    }

    if (appointment.status === 'cancelled') {
      const error = new Error('Cannot complete a cancelled appointment')
      error.status = 400
      throw error
    }

    // Update appointment status
    await client.query(
      `UPDATE appointments 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [appointmentId],
    )

    await client.query('COMMIT')

    // Get updated appointment details
    const updatedAppointment = await getAppointmentById(appointmentId)

    logger.info(
      `Appointment ${appointmentId} marked as completed by provider ${providerUserId}`,
    )
    return updatedAppointment
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error completing appointment:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get public summary of provider appointments (no client PII)
 * For public-facing endpoints or unauthenticated visibility
 * @param {number} providerId - Service provider ID
 * @param {string} status - Filter by status (optional)
 * @returns {Array} List of appointments without client names/emails
 */
export const getProviderAppointmentsSummary = async (
  providerId,
  status = null,
) => {
  let query = `
    SELECT 
      a.id,
      a.provider_id,
      a.time_slot_id,
      a.status,
      ts.slot_date,
      ts.start_time,
      ts.end_time,
      ts.duration
    FROM appointments a
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.provider_id = $1
  `

  const params = [providerId]

  if (status) {
    query += ' AND a.status = $2'
    params.push(status)
  }

  query += ' ORDER BY ts.slot_date DESC, ts.start_time DESC'

  const result = await pool.query(query, params)

  logger.info(
    `Retrieved ${result.rows.length} appointment summaries for provider ${providerId}`,
  )
  return result.rows
}
