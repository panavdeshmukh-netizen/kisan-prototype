import express from 'express'
import { getQueueStatusHandler } from './queue.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../../middleware/auth.middleware.js'
import { validateParams, bookingIdParamSchema } from './queue.validation.js'

const router = express.Router()

/**
 * @swagger
 * /queue/{bookingId}:
 *   get:
 *     summary: Get deterministic queue status for a booking (farmer only)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Queue status
 *       403:
 *         description: Not authorized to view this queue status
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:bookingId',
  authenticateToken,
  authorizeRoles('farmer'),
  validateParams(bookingIdParamSchema),
  getQueueStatusHandler,
)

export default router
