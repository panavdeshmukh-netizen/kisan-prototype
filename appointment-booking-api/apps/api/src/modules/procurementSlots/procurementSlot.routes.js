import express from 'express'
import { getSlotsHandler } from './procurementSlot.controller.js'
import { authenticateToken } from '../../middleware/auth.middleware.js'
import {
  validateQuery,
  procurementSlotQuerySchema,
} from './procurementSlot.validation.js'

const router = express.Router()

/**
 * @swagger
 * /procurement-slots:
 *   get:
 *     summary: Get available procurement slots for a centre and date
 *     tags: [ProcurementSlots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: centreId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procurement centre ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: 2026-09-10
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of available slots
 *       404:
 *         description: Procurement centre not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticateToken,
  validateQuery(procurementSlotQuerySchema),
  getSlotsHandler,
)

export default router
