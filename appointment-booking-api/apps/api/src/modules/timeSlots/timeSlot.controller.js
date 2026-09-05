import {
  createTimeSlot,
  getProviderTimeSlots,
  getAvailableTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
} from './timeSlot.service.js'
import logger from '../../utils/logger.js'

/**
 * Create a new time slot (provider only)
 * @route POST /time-slots
 */
export const createSlot = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { slot_date, start_time, end_time, duration } = req.body

    const timeSlot = await createTimeSlot(userId, {
      slot_date,
      start_time,
      end_time,
      duration,
    })

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: {
        timeSlot,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Create time slot error', error)
    next(error)
  }
}

/**
 * Get all time slots for current provider
 * @route GET /time-slots/my-slots
 */
export const getMySlots = async (req, res, next) => {
  try {
    const userId = req.user.id
    const timeSlots = await getProviderTimeSlots(userId)

    res.status(200).json({
      success: true,
      message: 'Time slots retrieved successfully',
      count: timeSlots.length,
      data: timeSlots,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Get my slots error', error)
    next(error)
  }
}

/**
 * Get available time slots for a provider (client view)
 * @route GET /time-slots/available/:providerId
 */
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { providerId } = req.params
    const { startDate, endDate } = req.query

    const timeSlots = await getAvailableTimeSlots(
      providerId,
      startDate,
      endDate,
    )

    res.status(200).json({
      success: true,
      message: 'Available time slots retrieved successfully',
      count: timeSlots.length,
      data: timeSlots,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Get available slots error', error)
    next(error)
  }
}

/**
 * Update a time slot (provider only)
 * @route PUT /time-slots/:slotId
 */
export const updateSlot = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { slotId } = req.params
    const { slot_date, start_time, end_time, duration } = req.body

    const updatedSlot = await updateTimeSlot(slotId, userId, {
      slot_date,
      start_time,
      end_time,
      duration,
    })

    res.status(200).json({
      success: true,
      message: 'Time slot updated successfully',
      data: {
        timeSlot: updatedSlot,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Update time slot error', error)
    next(error)
  }
}

/**
 * Delete a time slot (provider only)
 * @route DELETE /time-slots/:slotId
 */
export const deleteSlot = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { slotId } = req.params

    await deleteTimeSlot(slotId, userId)

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully',
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Delete time slot error', error)
    next(error)
  }
}
