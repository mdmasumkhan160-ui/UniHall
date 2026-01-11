const express = require('express')
const { handleLogin, handleRegister, handleMe } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/login', handleLogin)
router.post('/register', handleRegister)
router.get('/me', authMiddleware, handleMe)

module.exports = router
