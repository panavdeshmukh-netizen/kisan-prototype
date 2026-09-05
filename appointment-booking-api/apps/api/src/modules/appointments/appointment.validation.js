import Joi from 'joi'

/**
 * Validation schema for booking an appointment
 */
export const bookAppointmentSchema = Joi.object({
  time_slot_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Time slot ID must be a number',
    'number.integer': 'Time slot ID must be an integer',
    'number.positive': 'Time slot ID must be a positive number',
    'any.required': 'Time slot ID is required',
  }),
})

/**
 * Validation schema for appointment status query parameter
 */
export const appointmentStatusQuerySchema = Joi.object({
  status: Joi.string()
    .valid('booked', 'cancelled', 'completed')
    .optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: booked, cancelled, completed',
    }),
})

/**
 * Validation schema for appointment ID parameter
 */
export const appointmentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Appointment ID must be a number',
    'number.integer': 'Appointment ID must be an integer',
    'number.positive': 'Appointment ID must be a positive number',
    'any.required': 'Appointment ID is required',
  }),
})

/**
 * Validation schema for provider ID parameter
 */
export const providerIdParamSchema = Joi.object({
  providerId: Joi.number().integer().positive().required().messages({
    'number.base': 'Provider ID must be a number',
    'number.integer': 'Provider ID must be an integer',
    'number.positive': 'Provider ID must be a positive number',
    'any.required': 'Provider ID is required',
  }),
})

/**
 * Middleware to validate request body
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
    }

    req.body = value
    next()
  }
}

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
    }

    next()
  }
}

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
    }

    next()
  }
}
