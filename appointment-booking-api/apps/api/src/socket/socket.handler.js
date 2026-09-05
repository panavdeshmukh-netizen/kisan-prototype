import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

let io

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        logger.warn('Socket connection rejected: No token provided')
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify JWT token
      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          logger.warn('Socket connection rejected: Invalid token')
          return next(new Error('Authentication error: Invalid token'))
        }

        // Attach user info to socket
        socket.userId = decoded.id
        socket.userEmail = decoded.email
        socket.userRole = decoded.role

        logger.info(
          `Socket authenticated: user_id=${decoded.id}, email=${decoded.email}, role=${decoded.role}`,
        )
        next()
      })
    } catch (error) {
      logger.error('Socket authentication error', error)
      next(new Error('Authentication error'))
    }
  })

  // Handle socket connections
  io.on('connection', (socket) => {
    logger.info(
      `Client connected: socket_id=${socket.id}, user_id=${socket.userId}`,
    )

    // Join user to their personal room (for targeted notifications)
    socket.join(`user:${socket.userId}`)

    // If provider, join provider room
    if (socket.userRole === 'provider') {
      socket.join('providers')
      logger.info(`Provider joined providers room: user_id=${socket.userId}`)
    }

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(
        `Client disconnected: socket_id=${socket.id}, user_id=${socket.userId}, reason=${reason}`,
      )
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error: socket_id=${socket.id}`, error)
    })

    // Send connection success message
    socket.emit('connected', {
      message: 'Successfully connected to notification service',
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    })
  })

  logger.info('Socket.IO server initialized')
  return io
}

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.')
  }
  return io
}

/**
 * Emit event to specific user
 * @param {number} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUser = (userId, event, data) => {
  try {
    if (!io) {
      logger.warn('Socket.IO not initialized. Cannot emit event.')
      return
    }

    io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    })

    logger.debug(`Event emitted to user: user_id=${userId}, event=${event}`)
  } catch (error) {
    logger.error(`Error emitting to user: user_id=${userId}`, error)
  }
}

/**
 * Emit event to all providers
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToProviders = (event, data) => {
  try {
    if (!io) {
      logger.warn('Socket.IO not initialized. Cannot emit event.')
      return
    }

    io.to('providers').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    })

    logger.debug(`Event emitted to providers: event=${event}`)
  } catch (error) {
    logger.error('Error emitting to providers', error)
  }
}

/**
 * Emit event to multiple users
 * @param {Array<number>} userIds - Array of user IDs
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUsers = (userIds, event, data) => {
  try {
    if (!io) {
      logger.warn('Socket.IO not initialized. Cannot emit event.')
      return
    }

    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      })
    })

    logger.debug(`Event emitted to ${userIds.length} users: event=${event}`)
  } catch (error) {
    logger.error('Error emitting to users', error)
  }
}

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcastEvent = (event, data) => {
  try {
    if (!io) {
      logger.warn('Socket.IO not initialized. Cannot emit event.')
      return
    }

    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    })

    logger.debug(`Event broadcasted: event=${event}`)
  } catch (error) {
    logger.error('Error broadcasting event', error)
  }
}
