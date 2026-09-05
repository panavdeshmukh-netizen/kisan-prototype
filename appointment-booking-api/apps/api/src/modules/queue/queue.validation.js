import Joi from 'joi'

export const bookingIdParamSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required().messages({
    'number.base': 'bookingId must be a number',
    'number.integer': 'bookingId must be an integer',
    'number.positive': 'bookingId must be a positive number',
    'any.required': 'bookingId is required',
  }),
})

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
