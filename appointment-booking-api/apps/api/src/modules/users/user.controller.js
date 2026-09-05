import {
  getUserById,
  updateUserProfile,
  updateUserPassword,
  deleteUser,
} from './user.service.js'
import logger from '../../utils/logger.js'

/**
 * Get current user profile
 * @route GET /users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await getUserById(userId)

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Get profile error', error)
    next(error)
  }
}

/**
 * Update current user profile
 * @route PUT /users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { name, email } = req.body

    const updatedUser = await updateUserProfile(userId, { name, email })

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Update profile error', error)
    next(error)
  }
}

/**
 * Change user password
 * @route PUT /users/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { oldPassword, newPassword } = req.body

    await updateUserPassword(userId, oldPassword, newPassword)

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Change password error', error)
    next(error)
  }
}

/**
 * Delete user account
 * @route DELETE /users/profile
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id

    await deleteUser(userId)

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      })
    }
    logger.error('Delete account error', error)
    next(error)
  }
}
