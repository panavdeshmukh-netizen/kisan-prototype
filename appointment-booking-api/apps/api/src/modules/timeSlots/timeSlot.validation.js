import Joi from 'joi'
import logger from '../../utils/logger.js'

const createTimeSlotSchema = Joi.object({
  slot_date: Joi.date().iso().required().messages({
    'date.base': 'Slot date must be a valid date',
    'date.format': 'Slot date must be in YYYY-MM-DD format',
    'any.required': 'Slot date is required',
  }),

  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
      'any.required': 'Start time is required',
    }),

  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
      'any.required': 'End time is required',
    }),

  duration: Joi.number().integer().min(15).max(480).required().messages({
    'number.base': 'Duration must be a number',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration must not exceed 480 minutes (8 hours)',
    'any.required': 'Duration is required',
  }),
}).custom((value, helpers) => {
  if (value.slot_date && process.env.NODE_ENV !== 'test') {
    const inputDate = new Date(value.slot_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    inputDate.setHours(0, 0, 0, 0)
    if (inputDate < today) {
      return helpers.message({
        custom: 'Cannot create slot for a past date',
      })
    }
  }

  if (
    value.start_time &&
    value.end_time &&
    value.end_time <= value.start_time
  ) {
    return helpers.message({
      custom: 'End time must be chronologically after start time',
    })
  }
  return value
})

export const validateCreateTimeSlot = (req, res, next) => {
  const { error } = createTimeSlotSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0] || 'end_time',
      message: err.message,
    }))

    logger.warn('Time slot creation validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}

const updateTimeSlotSchema = Joi.object({
  slot_date: Joi.date().iso().optional().messages({
    'date.base': 'Slot date must be a valid date',
    'date.format': 'Slot date must be in YYYY-MM-DD format',
  }),

  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
    }),

  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
    }),

  duration: Joi.number().integer().min(15).max(480).optional().messages({
    'number.base': 'Duration must be a number',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration must not exceed 480 minutes (8 hours)',
  }),
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.start_time &&
      value.end_time &&
      value.end_time <= value.start_time
    ) {
      return helpers.message({
        custom: 'End time must be chronologically after start time',
      })
    }
    return value
  })
  .messages({
    'object.min': 'At least one field must be provided to update',
  })

export const validateUpdateTimeSlot = (req, res, next) => {
  const { error } = updateTimeSlotSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0] || 'end_time',
      message: err.message,
    }))

    logger.warn('Time slot update validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}
