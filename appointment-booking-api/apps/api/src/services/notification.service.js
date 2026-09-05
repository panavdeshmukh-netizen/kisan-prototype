import { emitToUser, emitToUsers } from '../socket/socket.handler.js'
import logger from '../utils/logger.js'

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'appointment:booked',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_COMPLETED: 'appointment:completed',
  APPOINTMENT_REMINDER: 'appointment:reminder',
  SLOT_CREATED: 'slot:created',
  SLOT_UPDATED: 'slot:updated',
}

/**
 * Send appointment booked notification
 * @param {Object} appointment - Appointment data
 * @param {number} appointment.id - Appointment ID
 * @param {number} appointment.client_id - Client user ID
 * @param {number} appointment.provider_user_id - Provider user ID
 * @param {Object} appointment.slot - Time slot details
 * @param {Object} appointment.client - Client details
 * @param {Object} appointment.provider - Provider details
 */
export const notifyAppointmentBooked = (appointment) => {
  try {
    // Notify provider
    emitToUser(
      appointment.provider_user_id,
      NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
      {
        type: 'appointment_booked',
        message: `New appointment booked by ${appointment.client.name}`,
        appointment: {
          id: appointment.id,
          date: appointment.slot.slot_date,
          time: appointment.slot.start_time,
          duration: appointment.slot.duration,
          client: {
            id: appointment.client_id,
            name: appointment.client.name,
            email: appointment.client.email,
          },
        },
      },
    )

    // Notify client (confirmation)
    emitToUser(appointment.client_id, NOTIFICATION_TYPES.APPOINTMENT_BOOKED, {
      type: 'appointment_confirmation',
      message: `Your appointment with ${appointment.provider.name} has been confirmed`,
      appointment: {
        id: appointment.id,
        date: appointment.slot.slot_date,
        time: appointment.slot.start_time,
        duration: appointment.slot.duration,
        provider: {
          name: appointment.provider.name,
          specialization: appointment.provider.specialization,
        },
      },
    })

    logger.info(
      `Notifications sent for appointment booking: appointment_id=${appointment.id}`,
    )
  } catch (error) {
    logger.error('Error sending appointment booked notification', error)
  }
}

/**
 * Send appointment cancelled notification
 * @param {Object} appointment - Appointment data
 * @param {number} appointment.id - Appointment ID
 * @param {number} appointment.client_id - Client user ID
 * @param {number} appointment.provider_user_id - Provider user ID
 * @param {Object} appointment.slot - Time slot details
 * @param {Object} appointment.client - Client details
 * @param {Object} appointment.provider - Provider details
 * @param {string} cancelledBy - Who cancelled ('client' or 'provider')
 */
export const notifyAppointmentCancelled = (appointment, cancelledBy) => {
  try {
    const userIds = [appointment.client_id, appointment.provider_user_id]

    // Notify both client and provider
    userIds.forEach((userId) => {
      const isClient = userId === appointment.client_id
      const wasInitiator =
        (cancelledBy === 'client' && isClient) ||
        (cancelledBy === 'provider' && !isClient)

      let message
      if (wasInitiator) {
        message = 'Your appointment has been cancelled'
      } else {
        const otherParty = isClient
          ? appointment.provider.name
          : appointment.client.name
        message = `Appointment with ${otherParty} has been cancelled`
      }

      emitToUser(userId, NOTIFICATION_TYPES.APPOINTMENT_CANCELLED, {
        type: 'appointment_cancelled',
        message,
        appointment: {
          id: appointment.id,
          date: appointment.slot?.slot_date || appointment.slot_date,
          time: appointment.slot?.start_time || appointment.start_time,
          cancelledBy,
          [isClient ? 'provider' : 'client']: isClient
            ? {
                name: appointment.provider.name,
                specialization: appointment.provider.specialization,
              }
            : {
                name: appointment.client.name,
                email: appointment.client.email,
              },
        },
      })
    })

    logger.info(
      `Notifications sent for appointment cancellation: appointment_id=${appointment.id}, cancelled_by=${cancelledBy}`,
    )
  } catch (error) {
    logger.error('Error sending appointment cancelled notification', error)
  }
}

/**
 * Send appointment completed notification
 * @param {Object} appointment - Appointment data
 * @param {number} appointment.client_id - Client user ID
 * @param {Object} appointment.provider - Provider details
 */
export const notifyAppointmentCompleted = (appointment) => {
  try {
    // Notify client
    emitToUser(
      appointment.client_id,
      NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
      {
        type: 'appointment_completed',
        message: `Your appointment with ${appointment.provider.name} has been completed`,
        appointment: {
          id: appointment.id,
          provider: {
            name: appointment.provider.name,
            specialization: appointment.provider.specialization,
          },
        },
      },
    )

    logger.info(
      `Completion notification sent: appointment_id=${appointment.id}`,
    )
  } catch (error) {
    logger.error('Error sending appointment completed notification', error)
  }
}

/**
 * Send appointment reminder notification
 * @param {Object} appointment - Appointment data
 * @param {number} appointment.client_id - Client user ID
 * @param {number} appointment.provider_user_id - Provider user ID
 * @param {Object} appointment.slot - Time slot details
 * @param {Object} appointment.provider - Provider details
 */
export const notifyAppointmentReminder = (appointment) => {
  try {
    const userIds = [appointment.client_id, appointment.provider_user_id]

    emitToUsers(userIds, NOTIFICATION_TYPES.APPOINTMENT_REMINDER, {
      type: 'appointment_reminder',
      message: `Reminder: You have an appointment tomorrow`,
      appointment: {
        id: appointment.id,
        date: appointment.slot.slot_date,
        time: appointment.slot.start_time,
        provider: {
          name: appointment.provider.name,
          specialization: appointment.provider.specialization,
        },
      },
    })

    logger.info(`Reminder sent: appointment_id=${appointment.id}`)
  } catch (error) {
    logger.error('Error sending appointment reminder', error)
  }
}
