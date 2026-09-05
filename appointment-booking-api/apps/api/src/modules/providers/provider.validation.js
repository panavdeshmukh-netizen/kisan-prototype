import Joi from 'joi'
import logger from '../../utils/logger.js'

const updateProviderSchema = Joi.object({
  specialization: Joi.string().trim().max(100).optional().messages({
    'string.max': 'Specialization must not exceed 100 characters',
  }),

  description: Joi.string().trim().max(1000).optional().messages({
    'string.max': 'Description must not exceed 1000 characters',
  }),
})
  .min(1)
  .messages({
    'object.min':
      'At least one field (specialization or description) must be provided',
  })

export const validateUpdateProvider = (req, res, next) => {
  const { error } = updateProviderSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }))

    logger.warn('Provider update validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}
