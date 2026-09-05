import express from 'express'
import {
  bookAppointmentHandler,
  getMyAppointmentsHandler,
  getProviderAppointmentsHandler,
  cancelAppointmentHandler,
  completeAppointmentHandler,
  getAppointmentByIdHandler,
} from './appointment.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../../middleware/auth.middleware.js'
import {
  validateBody,
  validateQuery,
  validateParams,
  bookAppointmentSchema,
  appointmentStatusQuerySchema,
  appointmentIdParamSchema,
  providerIdParamSchema,
} from './appointment.validation.js'

const router = express.Router()

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time_slot_id
 *             properties:
 *               time_slot_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Time slot not available or validation error
 *       403:
 *         description: Only clients can book appointments
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('client'),
  validateBody(bookAppointmentSchema),
  bookAppointmentHandler,
)

/**
 * @swagger
 * /appointments/my-appointments:
 *   get:
 *     summary: Get all appointments for authenticated user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [booked, cancelled, completed]
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-appointments',
  authenticateToken,
  validateQuery(appointmentStatusQuerySchema),
  getMyAppointmentsHandler,
)

/**
 * @swagger
 * /appointments/provider/{providerId}:
 *   get:
 *     summary: Get all appointments for a specific provider
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Provider ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [booked, cancelled, completed]
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: List of provider appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/provider/:providerId',
  authenticateToken,
  authorizeRoles('provider'),
  validateParams(providerIdParamSchema),
  validateQuery(appointmentStatusQuerySchema),
  getProviderAppointmentsHandler,
)

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       403:
 *         description: Not authorized to view this appointment
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticateToken,
  validateParams(appointmentIdParamSchema),
  getAppointmentByIdHandler,
)

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Cannot cancel (not found, already cancelled, or completed)
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/cancel',
  authenticateToken,
  validateParams(appointmentIdParamSchema),
  cancelAppointmentHandler,
)

/**
 * @swagger
 * /appointments/{id}/complete:
 *   put:
 *     summary: Mark appointment as completed (provider only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Cannot complete (not found, already completed, or cancelled)
 *       403:
 *         description: Only providers can complete appointments
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/complete',
  authenticateToken,
  authorizeRoles('provider'),
  validateParams(appointmentIdParamSchema),
  completeAppointmentHandler,
)

export default router
