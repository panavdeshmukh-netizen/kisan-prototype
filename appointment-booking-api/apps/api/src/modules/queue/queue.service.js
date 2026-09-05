import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

// Assumption (documented, see README notes / final report):
// The schema has no dedicated "now serving" counter, so queue position is
// derived deterministically from booking order within the same slot:
//   - Bookings for a slot are served in the order they were created (id ASC).
//   - The "current token" being served is the earliest booking in that slot
//     that is still in 'booked' status (i.e. not yet completed/cancelled).
//   - peopleAhead = number of other still-'booked' bookings created before
//     this one in the same slot.
//   - estimatedWaitMinutes = peopleAhead * AVG_SERVICE_MINUTES (a fixed,
//     hackathon-simple constant — no ML / historical throughput used).
const AVG_SERVICE_MINUTES = 5

/**
 * Get deterministic queue status for a booking.
 * @param {number} bookingId
 * @returns {Promise<Object|null>} - Queue status, or null if booking not found
 */
export const getQueueStatus = async (bookingId) => {
  const bookingResult = await pool.query(
    `SELECT id, farmer_id, slot_id, token_number, status
     FROM bookings WHERE id = $1`,
    [bookingId],
  )

  if (bookingResult.rows.length === 0) {
    return null
  }

  const booking = bookingResult.rows[0]

  // All still-active ('booked') bookings for this slot, in serving order
  const queueResult = await pool.query(
    `SELECT id, token_number
     FROM bookings
     WHERE slot_id = $1 AND status = 'booked'
     ORDER BY id ASC`,
    [booking.slot_id],
  )

  const queue = queueResult.rows
  const positionIndex = queue.findIndex((row) => row.id === booking.id)

  let currentToken
  let peopleAhead = 0
  let status

  if (booking.status === 'completed') {
    status = 'COMPLETED'
    currentToken = booking.token_number
  } else if (booking.status === 'cancelled') {
    status = 'CANCELLED'
    currentToken = booking.token_number
  } else if (positionIndex === -1) {
    // Defensive fallback: booking is 'booked' but not found in the queue
    // query (shouldn't normally happen).
    status = 'WAITING'
    currentToken = booking.token_number
  } else {
    currentToken = queue[0].token_number
    peopleAhead = positionIndex
    status = peopleAhead === 0 ? 'IN_PROGRESS' : 'WAITING'
  }

  const result = {
    bookingId: booking.id,
    tokenNumber: booking.token_number,
    currentToken,
    peopleAhead,
    estimatedWaitMinutes: peopleAhead * AVG_SERVICE_MINUTES,
    status,
  }

  logger.debug(`Queue status computed for booking_id=${bookingId}`, result)
  return result
}
