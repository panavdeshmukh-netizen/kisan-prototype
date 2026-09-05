import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

const BOOKING_DETAIL_SELECT = `
  SELECT
    b.id,
    b.farmer_id,
    b.centre_id,
    b.slot_id,
    b.token_number,
    b.status AS booking_status,
    b.created_at,
    b.updated_at,
    f.name AS farmer_name,
    f.phone AS farmer_phone,
    f.village AS farmer_village,
    pc.name AS centre_name,
    pc.location AS centre_location,
    pc.district AS centre_district,
    ps.slot_date,
    ps.start_time,
    ps.end_time,
    pr.id AS procurement_record_id,
    pr.procurement_status,
    pr.quantity,
    pay.id AS payment_id,
    pay.amount,
    pay.payment_status,
    pay.payment_date
  FROM bookings b
  JOIN farmers f ON b.farmer_id = f.id
  JOIN procurement_centres pc ON b.centre_id = pc.id
  JOIN procurement_slots ps ON b.slot_id = ps.id
  LEFT JOIN procurement_records pr ON pr.booking_id = b.id
  LEFT JOIN payments pay ON pay.booking_id = b.id
`

/**
 * Shape a raw joined booking row into a frontend-friendly object
 */
const formatBooking = (row) => ({
  id: row.id,
  status: row.booking_status,
  tokenNumber: row.token_number,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  farmer: {
    id: row.farmer_id,
    name: row.farmer_name,
    phone: row.farmer_phone,
    village: row.farmer_village,
  },
  centre: {
    id: row.centre_id,
    name: row.centre_name,
    location: row.centre_location,
    district: row.centre_district,
  },
  slot: {
    id: row.slot_id,
    date: row.slot_date,
    startTime: row.start_time,
    endTime: row.end_time,
  },
  procurement: row.procurement_record_id
    ? {
        id: row.procurement_record_id,
        status: row.procurement_status,
        quantity: row.quantity,
      }
    : null,
  payment: row.payment_id
    ? {
        id: row.payment_id,
        amount: row.amount,
        status: row.payment_status,
        paymentDate: row.payment_date,
      }
    : null,
})

/**
 * Get full booking details by booking ID
 * @param {number} bookingId
 * @returns {Promise<Object|null>}
 */
export const getBookingDetailsById = async (bookingId) => {
  const result = await pool.query(`${BOOKING_DETAIL_SELECT} WHERE b.id = $1`, [
    bookingId,
  ])

  if (result.rows.length === 0) {
    return null
  }

  return formatBooking(result.rows[0])
}

/**
 * Get all bookings belonging to a farmer
 * @param {number} farmerId
 * @returns {Promise<Array>}
 */
export const getFarmerBookings = async (farmerId) => {
  const result = await pool.query(
    `${BOOKING_DETAIL_SELECT} WHERE b.farmer_id = $1 ORDER BY b.created_at DESC`,
    [farmerId],
  )

  logger.debug(
    `Retrieved ${result.rows.length} bookings for farmer_id=${farmerId}`,
  )
  return result.rows.map(formatBooking)
}

/**
 * Create a booking for the authenticated farmer.
 * Uses a single Postgres transaction that:
 *  - locks the procurement centre + slot rows
 *  - validates centre/slot state and capacity
 *  - prevents duplicate active bookings for the same slot
 *  - inserts the booking, procurement record, and payment record
 *  - safely increments the slot's booked_count (and flips it to 'full'
 *    once capacity is reached)
 *
 * @param {number} farmerId - Farmer ID (resolved from the authenticated user)
 * @param {number} centreId - Procurement centre ID
 * @param {number} slotId - Procurement slot ID
 * @returns {Promise<Object>} - Full booking details
 */
export const createBooking = async (farmerId, centreId, slotId) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Lock the centre row to safely read its active status
    const centreResult = await client.query(
      'SELECT id, active FROM procurement_centres WHERE id = $1 FOR UPDATE',
      [centreId],
    )

    if (centreResult.rows.length === 0) {
      const error = new Error('Procurement centre not found')
      error.status = 404
      throw error
    }

    if (!centreResult.rows[0].active) {
      const error = new Error('Procurement centre is not active')
      error.status = 400
      throw error
    }

    // Lock the slot row to safely read + update capacity
    const slotResult = await client.query(
      'SELECT id, centre_id, capacity, booked_count, status FROM procurement_slots WHERE id = $1 FOR UPDATE',
      [slotId],
    )

    if (slotResult.rows.length === 0) {
      const error = new Error('Procurement slot not found')
      error.status = 404
      throw error
    }

    const slot = slotResult.rows[0]

    if (slot.centre_id !== centreId) {
      const error = new Error(
        'Selected slot does not belong to the selected procurement centre',
      )
      error.status = 400
      throw error
    }

    if (slot.status !== 'open') {
      const error = new Error(`Procurement slot is ${slot.status}`)
      error.status = 400
      throw error
    }

    if (slot.booked_count >= slot.capacity) {
      const error = new Error('Procurement slot is full')
      error.status = 400
      throw error
    }

    // Prevent duplicate ACTIVE booking for the same farmer + slot.
    // Cancelled (and completed) bookings remain in history but no
    // longer block a fresh booking for the same slot.
    const existingBooking = await client.query(
      `SELECT id FROM bookings WHERE farmer_id = $1 AND slot_id = $2 AND status = 'booked'`,
      [farmerId, slotId],
    )

    if (existingBooking.rows.length > 0) {
      const error = new Error(
        'You already have an active booking for this slot',
      )
      error.status = 409
      throw error
    }

    // Generate a simple, collision-free token number scoped to this slot:
    // the new booked_count (1-indexed) at this slot, zero-padded.
    const newBookedCount = slot.booked_count + 1
    const tokenNumber = `T-${String(newBookedCount).padStart(3, '0')}`

    const bookingResult = await client.query(
      `INSERT INTO bookings (farmer_id, centre_id, slot_id, token_number, status)
       VALUES ($1, $2, $3, $4, 'booked')
       RETURNING id`,
      [farmerId, centreId, slotId, tokenNumber],
    )
    const bookingId = bookingResult.rows[0].id

    // Update slot capacity, flip to 'full' if this booking fills it
    const newStatus = newBookedCount >= slot.capacity ? 'full' : slot.status
    await client.query(
      `UPDATE procurement_slots SET booked_count = $1, status = $2 WHERE id = $3`,
      [newBookedCount, newStatus, slotId],
    )

    // Create the procurement record (post-booking procurement tracking)
    await client.query(
      `INSERT INTO procurement_records (booking_id, farmer_id, procurement_status)
       VALUES ($1, $2, 'pending')`,
      [bookingId, farmerId],
    )

    // Create the payment record (placeholder amount; set once produce is procured)
    await client.query(
      `INSERT INTO payments (farmer_id, booking_id, amount, payment_status)
       VALUES ($1, $2, 0, 'pending')`,
      [farmerId, bookingId],
    )

    await client.query('COMMIT')

    logger.info(
      `Booking ${bookingId} created for farmer ${farmerId} (slot ${slotId}, token ${tokenNumber})`,
    )

    return await getBookingDetailsById(bookingId)
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      const err = new Error(
        'You already have an active booking for this slot',
      )
      err.status = 409
      throw err
    }
    logger.error('Error creating booking:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Cancel a booking belonging to the authenticated farmer.
 * @param {number} bookingId
 * @param {number} farmerId
 * @returns {Promise<Object>} - Updated booking details
 */
export const cancelBooking = async (bookingId, farmerId) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const bookingResult = await client.query(
      'SELECT id, farmer_id, slot_id, status FROM bookings WHERE id = $1 FOR UPDATE',
      [bookingId],
    )

    if (bookingResult.rows.length === 0) {
      const error = new Error('Booking not found')
      error.status = 404
      throw error
    }

    const booking = bookingResult.rows[0]

    if (booking.farmer_id !== farmerId) {
      const error = new Error('Not authorized to cancel this booking')
      error.status = 403
      throw error
    }

    if (booking.status === 'cancelled') {
      const error = new Error('Booking is already cancelled')
      error.status = 400
      throw error
    }

    if (booking.status === 'completed') {
      const error = new Error('Cannot cancel a completed booking')
      error.status = 400
      throw error
    }

    await client.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [bookingId],
    )

    // Free up capacity on the slot; re-open it if it had been marked full
    await client.query(
      `UPDATE procurement_slots
       SET booked_count = GREATEST(booked_count - 1, 0),
           status = CASE WHEN status = 'full' THEN 'open' ELSE status END
       WHERE id = $1`,
      [booking.slot_id],
    )

    await client.query('COMMIT')

    logger.info(`Booking ${bookingId} cancelled by farmer ${farmerId}`)

    return await getBookingDetailsById(bookingId)
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error cancelling booking:', error)
    throw error
  } finally {
    client.release()
  }
}
