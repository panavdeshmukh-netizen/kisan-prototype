import { Router } from 'express'
import {
  getMyProfile,
  getProviders,
  updateProfile,
} from './provider.controller.js'
import { validateUpdateProvider } from './provider.validation.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all service providers
 *     description: Retrieve a list of all registered service providers with their specializations and contact information. Accessible to all authenticated users (both clients and providers).
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all providers retrieved successfully
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
 *                   description: Total number of providers
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Provider ID
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         description: Associated user ID
 *                         example: 2
 *                       name:
 *                         type: string
 *                         description: Provider's full name
 *                         example: Dr. Sarah Johnson
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Provider's email
 *                         example: sarah@example.com
 *                       specialization:
 *                         type: string
 *                         description: Provider's area of specialization
 *                         example: General Practitioner
 *                       description:
 *                         type: string
 *                         description: Detailed description of provider's services
 *                         example: Experienced GP with 10+ years in family medicine
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Provider registration date
 *                         example: 2026-01-10T08:00:00.000Z
 *             examples:
 *               multipleProviders:
 *                 summary: Multiple providers response
 *                 value:
 *                   success: true
 *                   count: 2
 *                   data:
 *                     - id: 1
 *                       user_id: 2
 *                       name: Dr. Sarah Johnson
 *                       email: sarah@example.com
 *                       specialization: General Practitioner
 *                       description: Experienced GP with 10+ years
 *                       created_at: 2026-01-10T08:00:00.000Z
 *                     - id: 2
 *                       user_id: 3
 *                       name: Dr. Michael Chen
 *                       email: michael@example.com
 *                       specialization: Dentist
 *                       description: Cosmetic and general dentistry specialist
 *                       created_at: 2026-01-15T09:30:00.000Z
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, getProviders)

/**
 * @swagger
 * /providers/profile:
 *   get:
 *     summary: Get current provider's profile
 *     description: Retrieve the profile information of the currently authenticated provider including their specialization and description. Only accessible to users with the 'provider' role.
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Provider ID
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       description: Associated user ID
 *                       example: 2
 *                     name:
 *                       type: string
 *                       description: Provider's full name
 *                       example: Dr. Sarah Johnson
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Provider's email
 *                       example: sarah@example.com
 *                     specialization:
 *                       type: string
 *                       description: Provider's area of specialization
 *                       example: General Practitioner
 *                     description:
 *                       type: string
 *                       description: Detailed description of services
 *                       example: Experienced GP with 10+ years in family medicine
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Provider registration date
 *                       example: 2026-01-10T08:00:00.000Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last profile update timestamp
 *                       example: 2026-02-01T10:00:00.000Z
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a provider
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
 *       404:
 *         description: Provider profile not found
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
 *                   example: Provider profile not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/profile',
  authenticateToken,
  authorizeRoles('provider'),
  getMyProfile,
)

/**
 * @swagger
 * /providers/profile:
 *   put:
 *     summary: Update provider profile
 *     description: Update the current provider's profile information including specialization and description. Only providers can update their own profile.
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *                 description: Provider's area of specialization or expertise
 *                 example: Pediatrician
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Detailed description of services, experience, and qualifications
 *                 example: Board-certified pediatrician with 15 years of experience in child healthcare
 *                 minLength: 10
 *                 maxLength: 500
 *           examples:
 *             updateSpecialization:
 *               summary: Update specialization only
 *               value:
 *                 specialization: Pediatric Cardiologist
 *             updateDescription:
 *               summary: Update description only
 *               value:
 *                 description: Specialized in treating heart conditions in children with over 12 years of experience
 *             updateBoth:
 *               summary: Update both fields
 *               value:
 *                 specialization: Orthopedic Surgeon
 *                 description: Expert in sports injuries and joint replacement surgeries with 20+ years of practice
 *     responses:
 *       200:
 *         description: Provider profile updated successfully
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
 *                   example: Provider profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 2
 *                     specialization:
 *                       type: string
 *                       example: Orthopedic Surgeon
 *                     description:
 *                       type: string
 *                       example: Expert in sports injuries and joint replacement surgeries
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-02-12T14:30:00.000Z
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               missingFields:
 *                 summary: No fields provided
 *                 value:
 *                   success: false
 *                   message: At least one field must be provided for update
 *               invalidLength:
 *                 summary: Invalid field length
 *                 value:
 *                   success: false
 *                   message: Validation error
 *                   errors:
 *                     - field: description
 *                       message: Description must be at least 10 characters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a provider
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
 *       404:
 *         description: Provider profile not found
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
 *                   example: Provider profile not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/profile',
  authenticateToken,
  authorizeRoles('provider'),
  validateUpdateProvider,
  updateProfile,
)

export default router
