/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         name:
 *           type: string
 *           description: User's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john@example.com
 *         role:
 *           type: string
 *           enum: [client, provider]
 *           description: User's role in the system
 *           example: client
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: 2026-01-15T10:30:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: 2026-02-10T14:20:00.000Z
 *
 *     ProviderProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Provider ID
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: Associated user ID
 *           example: 2
 *         name:
 *           type: string
 *           description: Provider's full name
 *           example: Dr. Sarah Johnson
 *         email:
 *           type: string
 *           format: email
 *           description: Provider's email
 *           example: sarah@example.com
 *         specialization:
 *           type: string
 *           description: Provider's area of specialization
 *           example: General Practitioner
 *         description:
 *           type: string
 *           description: Detailed provider description
 *           example: Experienced GP with 10+ years in family medicine
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Provider registration date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last profile update
 *
 *     TimeSlotDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Time slot ID
 *           example: 5
 *         provider_id:
 *           type: integer
 *           description: Provider ID
 *           example: 1
 *         provider_name:
 *           type: string
 *           description: Provider's name
 *           example: Dr. Sarah Johnson
 *         specialization:
 *           type: string
 *           description: Provider's specialization
 *           example: General Practitioner
 *         slot_date:
 *           type: string
 *           format: date
 *           description: Slot date
 *           example: "2026-02-20"
 *         start_time:
 *           type: string
 *           format: time
 *           description: Start time
 *           example: "09:00:00"
 *         end_time:
 *           type: string
 *           format: time
 *           description: End time
 *           example: "10:00:00"
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *           example: 60
 *         is_booked:
 *           type: boolean
 *           description: Whether the slot is booked
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     AppointmentDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Appointment ID
 *           example: 1
 *         client_id:
 *           type: integer
 *           description: Client user ID
 *           example: 10
 *         client_name:
 *           type: string
 *           description: Client's name
 *           example: John Doe
 *         client_email:
 *           type: string
 *           format: email
 *           description: Client's email
 *           example: john@example.com
 *         provider_id:
 *           type: integer
 *           description: Provider ID
 *           example: 1
 *         provider_name:
 *           type: string
 *           description: Provider's name
 *           example: Dr. Sarah Johnson
 *         provider_email:
 *           type: string
 *           format: email
 *           description: Provider's email
 *           example: sarah@example.com
 *         specialization:
 *           type: string
 *           description: Provider's specialization
 *           example: General Practitioner
 *         time_slot_id:
 *           type: integer
 *           description: Time slot ID
 *           example: 5
 *         status:
 *           type: string
 *           enum: [booked, cancelled, completed]
 *           description: Appointment status
 *           example: booked
 *         slot_date:
 *           type: string
 *           format: date
 *           description: Appointment date
 *           example: "2026-02-20"
 *         start_time:
 *           type: string
 *           format: time
 *           description: Start time
 *           example: "09:00:00"
 *         end_time:
 *           type: string
 *           format: time
 *           description: End time
 *           example: "10:00:00"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Booking timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation completed successfully
 *         data:
 *           type: object
 *           description: Response data
 *
 *     ListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           description: Total number of items
 *           example: 10
 *         data:
 *           type: array
 *           items:
 *             type: object
 *           description: Array of items
 */
