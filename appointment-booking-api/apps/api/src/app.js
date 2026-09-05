import createError from 'http-errors'
import express, { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'

import authRouter from './modules/auth/auth.routes.js'
import userRouter from './modules/users/user.routes.js'
import providerRouter from './modules/providers/provider.routes.js'
import timeSlotRouter from './modules/timeSlots/timeSlot.routes.js'
import appointmentRouter from './modules/appointments/appointment.routes.js'
import procurementCentreRouter from './modules/procurementCentres/procurementCentre.routes.js'
import procurementSlotRouter from './modules/procurementSlots/procurementSlot.routes.js'
import bookingRouter from './modules/bookings/booking.routes.js'
import queueRouter from './modules/queue/queue.routes.js'

const app = express()

// Security and utility middleware
app.use(helmet())
app.use(cors())
app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(cookieParser())

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Appointment Booking API Docs',
  }),
)

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Root route - API onboarding information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Appointment Booking API',
    version: '1.0.0',
    description:
      'A comprehensive REST API for managing appointment bookings between clients and service providers with real-time notifications.',
    documentation: {
      swagger: `${req.protocol}://${req.get('host')}/api-docs`,
      json: `${req.protocol}://${req.get('host')}/api-docs.json`,
    },
    quickStart: {
      step1: {
        title: 'Register an account',
        endpoint: 'POST /auth/register',
        description: "Create a new account as either a 'client' or 'provider'",
        exampleRequest: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'client',
        },
      },
      step2: {
        title: 'Login to get your token',
        endpoint: 'POST /auth/login',
        description: 'Authenticate and receive a JWT token',
        exampleRequest: {
          email: 'john@example.com',
          password: 'password123',
        },
      },
      step3: {
        title: 'Use the token',
        description:
          "Include the token in the Authorization header as 'Bearer YOUR_TOKEN' for all protected endpoints",
      },
    },
    endpoints: {
      authentication: {
        base: '/auth',
        routes: [
          'POST /auth/register - Register a new user',
          'POST /auth/login - Login and get JWT token',
        ],
      },
      users: {
        base: '/users',
        routes: [
          'GET /users/profile - Get current user profile',
          'PUT /users/profile - Update user profile',
          'PUT /users/password - Change password',
          'DELETE /users/profile - Delete account',
        ],
        authentication: 'Required',
      },
      providers: {
        base: '/providers',
        routes: [
          'GET /providers - Get all providers (all users)',
          'GET /providers/profile - Get provider profile (provider only)',
          'PUT /providers/profile - Update provider profile (provider only)',
        ],
        authentication: 'Required',
      },
      timeSlots: {
        base: '/time-slots',
        routes: [
          'POST /time-slots - Create time slot (provider only)',
          'GET /time-slots/my-slots - Get own slots (provider only)',
          'GET /time-slots/available/:providerId - Get available slots (all users)',
          'PUT /time-slots/:slotId - Update time slot (provider only)',
          'DELETE /time-slots/:slotId - Delete time slot (provider only)',
        ],
        authentication: 'Required',
      },
      appointments: {
        base: '/appointments',
        routes: [
          'POST /appointments - Book appointment (client only)',
          'GET /appointments/my-appointments - Get my appointments (all users)',
          'GET /appointments/provider/:providerId - Get provider appointments (all users)',
          'GET /appointments/:id - Get appointment by ID (all users)',
          'PUT /appointments/:id/cancel - Cancel appointment (all users)',
          'PUT /appointments/:id/complete - Complete appointment (provider only)',
        ],
        authentication: 'Required',
      },
      procurementCentres: {
        base: '/procurement-centres',
        routes: ['GET /procurement-centres - Get active procurement centres'],
        authentication: 'Required',
      },
      procurementSlots: {
        base: '/procurement-slots',
        routes: [
          'GET /procurement-slots?centreId=&date= - Get available slots for a centre/date',
        ],
        authentication: 'Required',
      },
      bookings: {
        base: '/bookings',
        routes: [
          'POST /bookings - Book a procurement slot (farmer only)',
          'GET /bookings/my-bookings - Get own bookings (farmer only)',
          'GET /bookings/:id - Get booking details (farmer only)',
          'PUT /bookings/:id/cancel - Cancel a booking (farmer only)',
        ],
        authentication: 'Required',
      },
      queue: {
        base: '/queue',
        routes: ['GET /queue/:bookingId - Get queue status (farmer only)'],
        authentication: 'Required',
      },
    },
    support: {
      email: 'support@appointmentbooking.com',
      documentation: 'Visit /api-docs for detailed API documentation',
    },
    status: 'operational',
    timestamp: new Date().toISOString(),
  })
})

app.use('/auth', authRouter)
app.use('/users', userRouter)
app.use('/providers', providerRouter)
app.use('/time-slots', timeSlotRouter)
app.use('/appointments', appointmentRouter)
app.use('/procurement-centres', procurementCentreRouter)
app.use('/procurement-slots', procurementSlotRouter)
app.use('/bookings', bookingRouter)
app.use('/queue', queueRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, _next) {
  const statusCode = err.status || 500
  res.status(statusCode).json({
    status: statusCode,
    message: err.message,
    error: req.app.get('env') === 'development' ? err.stack : {},
  })
})

export default app
