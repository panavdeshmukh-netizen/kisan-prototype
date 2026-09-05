import * as procurementSlotService from './procurementSlot.service.js'
import { getCentreById } from '../procurementCentres/procurementCentre.service.js'
import logger from '../../utils/logger.js'

/**
 * Get available procurement slots for a centre + date
 * GET /procurement-slots?centreId=<id>&date=<YYYY-MM-DD>
 */
export const getSlotsHandler = async (req, res, next) => {
  try {
    const centreId = parseInt(req.query.centreId, 10)
    const { date } = req.query

    const centre = await getCentreById(centreId)
    if (!centre) {
      return res.status(404).json({
        success: false,
        message: 'Procurement centre not found',
      })
    }

    const slots = await procurementSlotService.getAvailableSlots(
      centreId,
      date,
    )

    const data = slots.map((slot) => ({
      id: slot.id,
      centreId: slot.centre_id,
      date: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      capacity: slot.capacity,
      bookedCount: slot.booked_count,
      availableCapacity: slot.available_capacity,
      status: slot.status,
    }))

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getSlotsHandler:', error)
    next(error)
  }
}
