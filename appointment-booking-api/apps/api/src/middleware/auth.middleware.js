import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

/**
 * Middleware to authenticate JWT token from request headers
 * Protects routes by verifying the JWT token
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      logger.warn('Authentication failed: No token provided')
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      })
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        logger.warn('Authentication failed: Invalid token', {
          error: error.message,
        })
        return res.status(403).json({
          message: 'Invalid or expired token.',
        })
      }

      // Attach user info to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }

      logger.debug(`User authenticated: ${decoded.email} (${decoded.role})`)
      next()
    })
  } catch (error) {
    logger.error('Authentication middleware error', error)
    return res.status(500).json({
      message: 'Internal server error during authentication.',
    })
  }
}

/**
 * Middleware to authorize specific roles
 * Use after authenticateToken middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request object')
      return res.status(401).json({
        message: 'Authentication required.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Authorization failed: User ${req.user.email} with role ${req.user.role} attempted to access route requiring roles: ${allowedRoles.join(', ')}`,
      )
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      })
    }

    logger.debug(`User ${req.user.email} authorized with role ${req.user.role}`)
    next()
  }
}
