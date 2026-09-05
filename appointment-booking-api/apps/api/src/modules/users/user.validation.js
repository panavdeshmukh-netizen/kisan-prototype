import Joi from 'joi'
import logger from '../../utils/logger.js'

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),

  email: Joi.string().trim().email().optional().messages({
    'string.email': 'Must be a valid email address',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field (name or email) must be provided',
  })

export const validateUpdateProfile = (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }))

    logger.warn('Profile update validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required',
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required',
    }),
})

export const validateChangePassword = (req, res, next) => {
  const { error } = changePasswordSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }))

    logger.warn('Password change validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}
