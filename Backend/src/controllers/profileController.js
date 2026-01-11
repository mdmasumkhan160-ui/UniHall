const { getProfile, updateProfile, changePassword } = require('../services/authService')

async function fetchProfile(req, res, next) {
  try {
    const result = await getProfile(req.user.userId)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

async function saveProfile(req, res, next) {
  try {
    const result = await updateProfile(req.user.userId, req.body || {})
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' })
    }

    const result = await changePassword(req.user.userId, currentPassword, newPassword)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  fetchProfile,
  saveProfile,
  updatePassword
}
