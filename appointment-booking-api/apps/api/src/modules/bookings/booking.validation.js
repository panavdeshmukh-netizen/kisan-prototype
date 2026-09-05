import Joi from 'joi'

/**
 * Validation schema for creating a booking
 */
export const createBookingSchema = Joi.object({
  centreId: Joi.number().integer().positive().required().messages({
    'number.base': 'centreId must be a number',
    'number.integer': 'centreId must be an integer',
    'number.positive': 'centreId must be a positive number',
    'any.required': 'centreId is required',
  }),
  slotId: Joi.number().integer().positive().required().messages({
    'number.base': 'slotId must be a number',
    'number.integer': 'slotId must be an integer',
    'number.positive': 'slotId must be a positive number',
    'any.required': 'slotId is required',
  }),
})

/**
 * Validation schema for booking ID URL param
 */
export const bookingIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Booking ID must be a number',
    'number.integer': 'Booking ID must be an integer',
    'number.positive': 'Booking ID must be a positive number',
    'any.required': 'Booking ID is required',
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
 * Middleware to validate URL parameters.
 * Mirrors the existing appointments module: validates but does not
 * reassign req.params (kept consistent with validateQuery for safety
 * across Express versions).
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
