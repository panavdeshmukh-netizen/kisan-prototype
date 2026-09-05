import { Router } from 'express'
import {
  createSlot,
  getMySlots,
  getAvailableSlots,
  updateSlot,
  deleteSlot,
} from './timeSlot.controller.js'
import {
  validateCreateTimeSlot,
  validateUpdateTimeSlot,
} from './timeSlot.validation.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * /time-slots:
 *   post:
 *     summary: Create a new time slot
 *     description: Create an available time slot for appointments. Only providers can create time slots for their own availability. The slot must not overlap with existing slots.
 *     tags: [Time Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slot_date
 *               - start_time
 *               - end_time
 *               - duration
 *             properties:
 *               slot_date:
 *                 type: string
 *                 format: date
 *                 description: Date for the time slot (YYYY-MM-DD format)
 *                 example: "2026-02-20"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Start time in HH:MM format (24-hour)
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: End time in HH:MM format (24-hour)
 *                 example: "10:00"
 *               duration:
 *                 type: integer
 *                 description: Duration of the slot in minutes
 *                 minimum: 15
 *                 maximum: 480
 *                 example: 60
 *           examples:
 *             morningSlot:
 *               summary: Morning consultation slot
 *               value:
 *                 slot_date: "2026-02-20"
 *                 start_time: "09:00"
 *                 end_time: "10:00"
 *                 duration: 60
 *             quickConsultation:
 *               summary: 30-minute consultation
 *               value:
 *                 slot_date: "2026-02-21"
 *                 start_time: "14:30"
 *                 end_time: "15:00"
 *                 duration: 30
 *     responses:
 *       201:
 *         description: Time slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     provider_id:
 *                       type: integer
 *                       example: 1
 *                     slot_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-02-20"
 *                     start_time:
 *                       type: string
 *                       format: time
 *                       example: "09:00:00"
 *                     end_time:
 *                       type: string
 *                       format: time
 *                       example: "10:00:00"
 *                     duration:
 *                       type: integer
 *                       example: 60
 *                     is_booked:
 *                       type: boolean
 *                       example: false
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-02-12T10:00:00.000Z
 *       400:
 *         description: Validation error or slot already exists/overlaps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               slotExists:
 *                 summary: Slot already exists
 *                 value:
 *                   success: false
 *                   message: Time slot already exists for this time period
 *               invalidTime:
 *                 summary: Invalid time range
 *                 value:
 *                   success: false
 *                   message: End time must be after start time
 *               pastDate:
 *                 summary: Date in the past
 *                 value:
 *                   success: false
 *                   message: Cannot create slot for a past date
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only providers can create time slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Provider role required.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('provider'),
  validateCreateTimeSlot,
  createSlot,
)

/**
 * @swagger
 * /time-slots/my-slots:
 *   get:
 *     summary: Get provider's own time slots
 *     description: Retrieve all time slots created by the authenticated provider, including both booked and available slots. Useful for providers to manage their availability.
 *     tags: [Time Slots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of provider's time slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Total number of slots
 *                   example: 8
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       provider_id:
 *                         type: integer
 *                         example: 1
 *                       slot_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-02-20"
 *                       start_time:
 *                         type: string
 *                         format: time
 *                         example: "09:00:00"
 *                       end_time:
 *                         type: string
 *                         format: time
 *                         example: "10:00:00"
 *                       duration:
 *                         type: integer
 *                         example: 60
 *                       is_booked:
 *                         type: boolean
 *                         example: false
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only providers can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Provider role required.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my-slots',
  authenticateToken,
  authorizeRoles('provider'),
  getMySlots,
)

/**
 * @swagger
 * /time-slots/available/{providerId}:
 *   get:
 *     summary: Get available time slots for a specific provider
 *     description: Retrieve all available (unbooked) time slots for a specific provider. Clients can use this to find when they can book appointments.
 *     tags: [Time Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The provider's ID to fetch available slots for
 *         example: 1
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional filter by specific date (YYYY-MM-DD)
 *         example: "2026-02-20"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional filter for date range start (YYYY-MM-DD)
 *         example: "2026-02-20"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional filter for date range end (YYYY-MM-DD)
 *         example: "2026-02-28"
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of available slots
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       provider_id:
 *                         type: integer
 *                         example: 1
 *                       provider_name:
 *                         type: string
 *                         example: Dr. Sarah Johnson
 *                       specialization:
 *                         type: string
 *                         example: General Practitioner
 *                       slot_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-02-20"
 *                       start_time:
 *                         type: string
 *                         format: time
 *                         example: "09:00:00"
 *                       end_time:
 *                         type: string
 *                         format: time
 *                         example: "10:00:00"
 *                       duration:
 *                         type: integer
 *                         example: 60
 *                       is_booked:
 *                         type: boolean
 *                         example: false
 *             examples:
 *               withSlots:
 *                 summary: Available slots found
 *                 value:
 *                   success: true
 *                   count: 3
 *                   data:
 *                     - id: 5
 *                       provider_id: 1
 *                       provider_name: Dr. Sarah Johnson
 *                       specialization: General Practitioner
 *                       slot_date: "2026-02-20"
 *                       start_time: "09:00:00"
 *                       end_time: "10:00:00"
 *                       duration: 60
 *                       is_booked: false
 *                     - id: 6
 *                       provider_id: 1
 *                       provider_name: Dr. Sarah Johnson
 *                       specialization: General Practitioner
 *                       slot_date: "2026-02-20"
 *                       start_time: "14:00:00"
 *                       end_time: "15:00:00"
 *                       duration: 60
 *                       is_booked: false
 *               noSlots:
 *                 summary: No available slots
 *                 value:
 *                   success: true
 *                   count: 0
 *                   data: []
 *       400:
 *         description: Invalid provider ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid provider ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Provider not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/available/:providerId', authenticateToken, getAvailableSlots)

/**
 * @swagger
 * /time-slots/{slotId}:
 *   put:
 *     summary: Update a time slot
 *     description: Update an existing time slot's details. Only the provider who created the slot can update it, and only if the slot is not already booked.
 *     tags: [Time Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the time slot to update
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slot_date:
 *                 type: string
 *                 format: date
 *                 description: Updated date for the time slot (YYYY-MM-DD)
 *                 example: "2026-02-21"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Updated start time in HH:MM format
 *                 example: "10:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: Updated end time in HH:MM format
 *                 example: "11:00"
 *               duration:
 *                 type: integer
 *                 description: Updated duration in minutes
 *                 minimum: 15
 *                 maximum: 480
 *                 example: 60
 *           examples:
 *             updateTime:
 *               summary: Update time only
 *               value:
 *                 start_time: "10:00"
 *                 end_time: "11:00"
 *             updateDate:
 *               summary: Update date only
 *               value:
 *                 slot_date: "2026-02-21"
 *             updateAll:
 *               summary: Update all fields
 *               value:
 *                 slot_date: "2026-02-21"
 *                 start_time: "10:00"
 *                 end_time: "11:00"
 *                 duration: 60
 *     responses:
 *       200:
 *         description: Time slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     provider_id:
 *                       type: integer
 *                       example: 1
 *                     slot_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-02-21"
 *                     start_time:
 *                       type: string
 *                       format: time
 *                       example: "10:00:00"
 *                     end_time:
 *                       type: string
 *                       format: time
 *                       example: "11:00:00"
 *                     duration:
 *                       type: integer
 *                       example: 60
 *                     is_booked:
 *                       type: boolean
 *                       example: false
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-02-12T11:30:00.000Z
 *       400:
 *         description: Cannot update - slot is booked or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               slotBooked:
 *                 summary: Slot is already booked
 *                 value:
 *                   success: false
 *                   message: Cannot update a booked time slot
 *               validationError:
 *                 summary: Invalid data
 *                 value:
 *                   success: false
 *                   message: End time must be after start time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not the slot owner or not a provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized to update this time slot
 *       404:
 *         description: Time slot not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Time slot not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:slotId',
  authenticateToken,
  authorizeRoles('provider'),
  validateUpdateTimeSlot,
  updateSlot,
)

/**
 * @swagger
 * /time-slots/{slotId}:
 *   delete:
 *     summary: Delete a time slot
 *     description: Permanently delete a time slot. Only the provider who created the slot can delete it, and only if the slot has not been booked.
 *     tags: [Time Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the time slot to delete
 *         example: 5
 *     responses:
 *       200:
 *         description: Time slot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot deleted successfully
 *       400:
 *         description: Cannot delete - slot is booked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Cannot delete a booked time slot. Please cancel the appointment first.
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not the slot owner or not a provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized to delete this time slot
 *       404:
 *         description: Time slot not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Time slot not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:slotId',
  authenticateToken,
  authorizeRoles('provider'),
  deleteSlot,
)

export default router
