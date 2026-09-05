import express from 'express'
import {
  createBookingHandler,
  getMyBookingsHandler,
  getBookingByIdHandler,
  cancelBookingHandler,
} from './booking.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../../middleware/auth.middleware.js'
import {
  validateBody,
  validateParams,
  createBookingSchema,
  bookingIdParamSchema,
} from './booking.validation.js'

const router = express.Router()

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book a procurement slot (farmer only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - centreId
 *               - slotId
 *             properties:
 *               centreId:
 *                 type: integer
 *               slotId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid centre/slot, slot full, or slot not active
 *       403:
 *         description: Only farmers can create bookings
 *       404:
 *         description: Centre or slot not found
 *       409:
 *         description: Duplicate booking
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('farmer'),
  validateBody(createBookingSchema),
  createBookingHandler,
)

/**
 * @swagger
 * /bookings/my-bookings:
 *   get:
 *     summary: Get all bookings for the authenticated farmer
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the farmer's bookings
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-bookings',
  authenticateToken,
  authorizeRoles('farmer'),
  getMyBookingsHandler,
)

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details by ID (must belong to the authenticated farmer)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       403:
 *         description: Not authorized to view this booking
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('farmer'),
  validateParams(bookingIdParamSchema),
  getBookingByIdHandler,
)

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking (must belong to the authenticated farmer)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking already cancelled or completed
 *       403:
 *         description: Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/cancel',
  authenticateToken,
  authorizeRoles('farmer'),
  validateParams(bookingIdParamSchema),
  cancelBookingHandler,
)

export default router
