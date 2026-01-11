const { testConnection } = require('../../config/db')

async function getHealth(req, res, next) {
  try {
    await testConnection()
    res.json({ success: true, message: 'API is running', database: 'reachable' })
  } catch (err) {
    err.status = 500
    err.message = 'API is running but database check failed'
    next(err)
  }
}

module.exports = {
  getHealth
}
