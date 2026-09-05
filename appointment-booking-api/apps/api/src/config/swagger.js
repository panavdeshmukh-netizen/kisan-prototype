import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointment Booking API',
      version: '1.0.0',
      description:
        'A comprehensive REST API for managing appointment bookings between clients and service providers with real-time notifications via WebSocket.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://appointment-booking-api-xxb5.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from the login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: "User's full name",
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: "User's email address",
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['client', 'provider'],
              description: 'User role',
              example: 'client',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Provider: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Provider ID',
              example: 1,
            },
            user_id: {
              type: 'integer',
              description: 'Associated user ID',
              example: 2,
            },
            specialization: {
              type: 'string',
              description: "Provider's specialization",
              example: 'General Practitioner',
            },
            description: {
              type: 'string',
              description: "Provider's description",
              example: 'Experienced GP with 10+ years',
            },
            name: {
              type: 'string',
              description: "Provider's name",
              example: 'Dr. Sarah Johnson',
            },
            email: {
              type: 'string',
              format: 'email',
              description: "Provider's email",
              example: 'sarah@example.com',
            },
          },
        },
        TimeSlot: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Time slot ID',
              example: 5,
            },
            provider_id: {
              type: 'integer',
              description: 'Provider ID',
              example: 1,
            },
            slot_date: {
              type: 'string',
              format: 'date',
              description: 'Date of the slot',
              example: '2026-02-10',
            },
            start_time: {
              type: 'string',
              format: 'time',
              description: 'Start time',
              example: '10:00:00',
            },
            end_time: {
              type: 'string',
              format: 'time',
              description: 'End time',
              example: '11:00:00',
            },
            duration: {
              type: 'integer',
              description: 'Duration in minutes',
              example: 60,
            },
            is_booked: {
              type: 'boolean',
              description: 'Whether the slot is booked',
              example: false,
            },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Appointment ID',
              example: 1,
            },
            client_id: {
              type: 'integer',
              description: 'Client user ID',
              example: 10,
            },
            provider_id: {
              type: 'integer',
              description: 'Provider ID',
              example: 2,
            },
            time_slot_id: {
              type: 'integer',
              description: 'Time slot ID',
              example: 5,
            },
            status: {
              type: 'string',
              enum: ['booked', 'cancelled', 'completed'],
              description: 'Appointment status',
              example: 'booked',
            },
            slot_date: {
              type: 'string',
              format: 'date',
              description: 'Appointment date',
              example: '2026-02-10',
            },
            start_time: {
              type: 'string',
              format: 'time',
              description: 'Appointment start time',
              example: '10:00:00',
            },
            end_time: {
              type: 'string',
              format: 'time',
              description: 'Appointment end time',
              example: '11:00:00',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation error',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'Providers',
        description: 'Service provider management',
      },
      {
        name: 'Time Slots',
        description: 'Time slot management',
      },
      {
        name: 'Appointments',
        description: 'Appointment booking and management',
      },
    ],
  },
  apis: ['./src/modules/*/*.routes.js', './src/config/swagger-annotations.js'], // Path to the API routes
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
