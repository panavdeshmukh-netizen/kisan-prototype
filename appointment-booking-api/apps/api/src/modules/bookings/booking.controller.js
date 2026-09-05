import * as bookingService from './booking.service.js'
import { getFarmerByUserId } from '../farmers/farmer.service.js'
import logger from '../../utils/logger.js'

/**
 * Create a booking for the authenticated farmer
 * POST /bookings
 */
export const createBookingHandler = async (req, res, next) => {
  try {
    const { centreId, slotId } = req.body

    // Derive the farmer from the authenticated user; never trust a
    // farmerId supplied in the request body.
    const farmer = await getFarmerByUserId(req.user.id)

    const booking = await bookingService.createBooking(
      farmer.id,
      centreId,
      slotId,
    )

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in createBookingHandler:', error)
    next(error)
  }
}

/**
 * Get all bookings for the authenticated farmer
 * GET /bookings/my-bookings
 */
export const getMyBookingsHandler = async (req, res, next) => {
  try {
    const farmer = await getFarmerByUserId(req.user.id)
    const bookings = await bookingService.getFarmerBookings(farmer.id)

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getMyBookingsHandler:', error)
    next(error)
  }
}

/**
 * Get a single booking by ID (must belong to the authenticated farmer)
 * GET /bookings/:id
 */
export const getBookingByIdHandler = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10)
    const farmer = await getFarmerByUserId(req.user.id)

    const booking = await bookingService.getBookingDetailsById(bookingId)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      })
    }

    if (booking.farmer.id !== farmer.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      })
    }

    res.status(200).json({
      success: true,
      data: booking,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getBookingByIdHandler:', error)
    next(error)
  }
}

/**
 * Cancel a booking belonging to the authenticated farmer
 * PUT /bookings/:id/cancel
 */
export const cancelBookingHandler = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10)
    const farmer = await getFarmerByUserId(req.user.id)

    const booking = await bookingService.cancelBooking(bookingId, farmer.id)

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in cancelBookingHandler:', error)
    next(error)
  }
}
