import * as queueService from './queue.service.js'
import { getFarmerByUserId } from '../farmers/farmer.service.js'
import { pool } from '../../config/database.js'
import logger from '../../utils/logger.js'

/**
 * Get queue status for a booking (must belong to the authenticated farmer)
 * GET /queue/:bookingId
 */
export const getQueueStatusHandler = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10)
    const farmer = await getFarmerByUserId(req.user.id)

    // Confirm ownership before exposing queue details
    const ownerCheck = await pool.query(
      'SELECT farmer_id FROM bookings WHERE id = $1',
      [bookingId],
    )

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    if (ownerCheck.rows[0].farmer_id !== farmer.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this queue status',
      })
    }

    const queueStatus = await queueService.getQueueStatus(bookingId)

    res.status(200).json({
      success: true,
      data: queueStatus,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getQueueStatusHandler:', error)
    next(error)
  }
}
