const { verifyToken } = require('../utils/token')
const { fetchCurrentUser } = require('../services/authService')

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const payload = verifyToken(token)
    const user = await fetchCurrentUser(payload.sub)
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}

module.exports = authMiddleware

