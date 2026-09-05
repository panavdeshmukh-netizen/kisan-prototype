import express from 'express'
import { getCentresHandler } from './procurementCentre.controller.js'
import { authenticateToken } from '../../middleware/auth.middleware.js'

const router = express.Router()

/**
 * @swagger
 * /procurement-centres:
 *   get:
 *     summary: Get all active procurement centres
 *     tags: [ProcurementCentres]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active procurement centres
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
 *                       district:
 *                         type: string
 *                       capacity:
 *                         type: integer
 *                       active:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getCentresHandler)

export default router
