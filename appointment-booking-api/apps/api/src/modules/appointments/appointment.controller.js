import * as appointmentService from './appointment.service.js'
import { getProviderByUserId } from '../providers/provider.service.js'
import {
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyAppointmentCompleted,
} from '../../services/notification.service.js'
import logger from '../../utils/logger.js'

/**
 * Book an appointment
 * POST /appointments
 */
export const bookAppointmentHandler = async (req, res, next) => {
  try {
    const clientId = req.user.id
    const { time_slot_id } = req.body

    // Verify user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can book appointments',
      })
    }

    const appointment = await appointmentService.bookAppointment(
      clientId,
      time_slot_id,
    )

    // Send real-time notifications
    notifyAppointmentBooked({
      id: appointment.id,
      client_id: appointment.client_id,
      provider_user_id: appointment.provider_user_id,
      slot: {
        slot_date: appointment.slot_date,
        start_time: appointment.start_time,
        duration: appointment.duration,
      },
      client: {
        name: appointment.client_name,
        email: appointment.client_email,
      },
      provider: {
        name: appointment.provider_name,
        specialization: appointment.specialization,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        id: appointment.id,
        client_id: appointment.client_id,
        provider_id: appointment.provider_id,
        time_slot_id: appointment.time_slot_id,
        status: appointment.status,
        slot_date: appointment.slot_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration: appointment.duration,
        provider: {
          name: appointment.provider_name,
          specialization: appointment.specialization,
        },
        created_at: appointment.created_at,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in bookAppointmentHandler:', error)
    next(error)
  }
}

/**
 * Get appointments for the authenticated user
 * GET /appointments/my-appointments
 */
export const getMyAppointmentsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const { status } = req.query

    let appointments

    if (userRole === 'client') {
      appointments = await appointmentService.getClientAppointments(
        userId,
        status,
      )
    } else if (userRole === 'provider') {
      const provider = await getProviderByUserId(userId)
      appointments = await appointmentService.getProviderAppointments(
        provider.id,
        status,
      )
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role',
      })
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getMyAppointmentsHandler:', error)
    next(error)
  }
}

/**
 * Get appointments for a specific provider (accessible by anyone)
 * GET /appointments/provider/:providerId
 */
export const getProviderAppointmentsHandler = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { providerId } = req.params
    const { status } = req.query

    const provider = await getProviderByUserId(userId)

    // Verify provider is requesting their own appointments
    if (provider.id !== parseInt(providerId, 10)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these appointments',
      })
    }

    const appointments = await appointmentService.getProviderAppointments(
      parseInt(providerId, 10),
      status,
    )

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getProviderAppointmentsHandler:', error)
    next(error)
  }
}

/**
 * Cancel an appointment
 * PUT /appointments/:id/cancel
 */
export const cancelAppointmentHandler = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id, 10)
    const userId = req.user.id
    const userRole = req.user.role

    const appointment = await appointmentService.cancelAppointment(
      appointmentId,
      userId,
      userRole,
    )

    // Send real-time notifications
    notifyAppointmentCancelled(
      {
        id: appointment.id,
        client_id: appointment.client_id,
        provider_user_id: appointment.provider_user_id,
        slot_date: appointment.slot_date,
        start_time: appointment.start_time,
        client: {
          name: appointment.client_name,
          email: appointment.client_email,
        },
        provider: {
          name: appointment.provider_name,
          specialization: appointment.specialization,
        },
      },
      userRole,
    )

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        id: appointment.id,
        status: appointment.status,
        slot_date: appointment.slot_date,
        start_time: appointment.start_time,
        updated_at: appointment.updated_at,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in cancelAppointmentHandler:', error)
    next(error)
  }
}

/**
 * Mark appointment as completed (provider only)
 * PUT /appointments/:id/complete
 */
export const completeAppointmentHandler = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id, 10)
    const providerUserId = req.user.id

    // Verify user is a provider
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can mark appointments as completed',
      })
    }

    const appointment = await appointmentService.completeAppointment(
      appointmentId,
      providerUserId,
    )

    // Send real-time notification
    notifyAppointmentCompleted({
      id: appointment.id,
      client_id: appointment.client_id,
      provider: {
        name: appointment.provider_name,
        specialization: appointment.specialization,
      },
    })

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      data: {
        id: appointment.id,
        status: appointment.status,
        slot_date: appointment.slot_date,
        start_time: appointment.start_time,
        updated_at: appointment.updated_at,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in completeAppointmentHandler:', error)
    next(error)
  }
}

/**
 * Get appointment by ID
 * GET /appointments/:id
 */
export const getAppointmentByIdHandler = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id, 10)
    const userId = req.user.id
    const userRole = req.user.role

    const appointment =
      await appointmentService.getAppointmentById(appointmentId)

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    // Verify user is authorized to view this appointment
    const isClient = userRole === 'client' && appointment.client_id === userId
    const isProvider =
      userRole === 'provider' && appointment.provider_user_id === userId

    if (!isClient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment',
      })
    }

    res.status(200).json({
      success: true,
      data: appointment,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getAppointmentByIdHandler:', error)
    next(error)
  }
}
