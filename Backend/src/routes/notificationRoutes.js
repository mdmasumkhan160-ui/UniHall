const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { listMyNotifications, markRead, createBroadcast } = require('../controllers/notificationController')

const router = express.Router()
router.use(authMiddleware)

router.get('/', listMyNotifications)
router.post('/:id/read', markRead)
router.post('/', createBroadcast)

module.exports = router
