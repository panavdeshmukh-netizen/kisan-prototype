import Joi from 'joi'

/**
 * Validation schema for GET /procurement-slots query params
 */
export const procurementSlotQuerySchema = Joi.object({
  centreId: Joi.number().integer().positive().required().messages({
    'number.base': 'centreId must be a number',
    'number.integer': 'centreId must be an integer',
    'number.positive': 'centreId must be a positive number',
    'any.required': 'centreId is required',
  }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'date must be in YYYY-MM-DD format',
      'any.required': 'date is required',
    }),
})

/**
 * Middleware to validate query parameters.
 * Note: Express 5 exposes req.query as a getter-only property, so we
 * validate against it but do not attempt to reassign it (mirrors the
 * existing validateQuery pattern used by the appointments module).
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
