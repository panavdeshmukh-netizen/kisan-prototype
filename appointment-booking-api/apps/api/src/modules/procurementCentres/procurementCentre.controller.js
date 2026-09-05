import * as procurementCentreService from './procurementCentre.service.js'
import logger from '../../utils/logger.js'

/**
 * Get all active procurement centres
 * GET /procurement-centres
 */
export const getCentresHandler = async (req, res, next) => {
  try {
    const centres = await procurementCentreService.getActiveCentres()

    res.status(200).json({
      success: true,
      count: centres.length,
      data: centres,
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Error in getCentresHandler:', error)
    next(error)
  }
}
