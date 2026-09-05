import { createUser, authenticateUser } from './auth.service.js'
import logger from '../../utils/logger.js'
import jwt from 'jsonwebtoken'

/**
 * Handle user registration request
 * @route POST /auth/register
 */
export const registrationHandler = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, village, address, registrationId } =
      req.body

    // Create user via service layer
    // (phone/village/address/registrationId are only used when role === 'farmer';
    // validation guarantees they are absent for other roles)
    const newUser = await createUser({
      name,
      email,
      password,
      role,
      phone,
      village,
      address,
      registrationId,
    })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
      },
    })
  } catch (error) {
    // Handle known errors with status codes
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    // Pass unexpected errors to error handler
    logger.error('Registration handler error', error)
    next(error)
  }
}

/**
 * Handle user login request with JWT token generation
 * @route POST /auth/login
 */
export const loginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Authenticate user via service layer
    const user = await authenticateUser(email, password)

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    )

    logger.info(`User logged in successfully: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    // Handle known errors with status codes
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }

    // Pass unexpected errors to error handler
    logger.error('Login handler error', error)
    next(error)
  }
}
