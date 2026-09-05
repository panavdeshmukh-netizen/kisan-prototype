import Joi from 'joi'
import logger from '../../utils/logger.js'

const registrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),

  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Must be a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),

  role: Joi.string()
    .valid('client', 'provider', 'farmer')
    .required()
    .messages({
      'string.empty': 'Role is required',
      'any.only': "Role must be either 'client', 'provider' or 'farmer'",
      'any.required': 'Role is required',
    }),

  // Farmer-only profile fields (used to populate the `farmers` table).
  // Forbidden for client/provider registrations, phone is required
  // for farmer registrations since farmers.phone is NOT NULL.
  phone: Joi.string()
    .trim()
    .min(7)
    .max(15)
    .when('role', {
      is: 'farmer',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.empty': 'Phone number is required for farmer registration',
      'string.min': 'Phone number must be at least 7 characters long',
      'string.max': 'Phone number must not exceed 15 characters',
      'any.required': 'Phone number is required for farmer registration',
      'any.unknown': 'Phone number is only applicable for farmer registration',
    }),

  village: Joi.string()
    .trim()
    .max(100)
    .when('role', {
      is: 'farmer',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Village must not exceed 100 characters',
      'any.unknown': 'Village is only applicable for farmer registration',
    }),

  address: Joi.string()
    .trim()
    .max(500)
    .when('role', {
      is: 'farmer',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Address must not exceed 500 characters',
      'any.unknown': 'Address is only applicable for farmer registration',
    }),

  registrationId: Joi.string()
    .trim()
    .max(50)
    .when('role', {
      is: 'farmer',
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.max': 'Registration ID must not exceed 50 characters',
      'any.unknown':
        'Registration ID is only applicable for farmer registration',
    }),
})

export const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, {
    abortEarly: false, // if true, stops validation on first error otherwise returns all errors
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }))

    logger.warn('Validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Must be a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
})

export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path[0],
      message: err.message,
    }))

    logger.warn('Login validation failed', { errors })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}
