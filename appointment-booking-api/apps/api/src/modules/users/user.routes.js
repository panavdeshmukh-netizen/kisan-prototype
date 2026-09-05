import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from './user.controller.js'
import {
  validateUpdateProfile,
  validateChangePassword,
} from './user.validation.js'
import { authenticateToken } from '../../middleware/auth.middleware.js'

const router = Router()

// All user routes require authentication
router.use(authenticateToken)

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Retrieve the profile information of the currently authenticated user including their role, email, and account details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                       description: User ID
 *                       example: 1
 *                     name:
 *                       type: string
 *                       description: User's full name
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User's email address
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       enum: [client, provider]
 *                       description: User's role in the system
 *                       example: client
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation timestamp
 *                       example: 2026-01-15T10:30:00.000Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last profile update timestamp
 *                       example: 2026-02-10T14:20:00.000Z
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
router.get('/profile', getProfile)

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information (name and/or email). Users can only update their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated user's full name
 *                 example: John Smith
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated user's email address (must be unique)
 *                 example: john.smith@example.com
 *           examples:
 *             updateName:
 *               summary: Update only name
 *               value:
 *                 name: John Smith
 *             updateEmail:
 *               summary: Update only email
 *               value:
 *                 email: john.smith@example.com
 *             updateBoth:
 *               summary: Update both name and email
 *               value:
 *                 name: John Smith
 *                 email: john.smith@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: John Smith
 *                     email:
 *                       type: string
 *                       example: john.smith@example.com
 *                     role:
 *                       type: string
 *                       example: client
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             examples:
 *               emailExists:
 *                 summary: Email already in use
 *                 value:
 *                   success: false
 *                   message: Email already exists
 *               validationError:
 *                 summary: Validation failed
 *                 value:
 *                   success: false
 *                   message: Validation error
 *                   errors:
 *                     - field: email
 *                       message: Invalid email format
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
router.put('/profile', validateUpdateProfile, updateProfile)

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Change user password
 *     description: Change the password for the currently authenticated user. Requires the old password for verification.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password for verification
 *                 example: OldPassword1
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (minimum 8 characters with upper, lower, and digit)
 *                 minLength: 8
 *                 example: NewSecurePassword456
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match new password
 *                 example: NewSecurePassword456
 *           examples:
 *             changePassword:
 *               summary: Change password example
 *               value:
 *                 oldPassword: CurrentPassword1
 *                 newPassword: NewSecurePassword456
 *                 confirmPassword: NewSecurePassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid old password or validation error
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
 *               wrongPassword:
 *                 summary: Incorrect old password
 *                 value:
 *                   success: false
 *                   message: Invalid old password
 *               tooShort:
 *                 summary: New password too short
 *                 value:
 *                   success: false
 *                   message: New password must be at least 6 characters
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
router.put('/password', validateChangePassword, changePassword)

/**
 * @swagger
 * /users/profile:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the currently authenticated user's account. This action cannot be undone. All associated data including appointments will be affected.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/profile', deleteAccount)

export default router
