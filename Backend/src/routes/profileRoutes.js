const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { fetchProfile, saveProfile, updatePassword } = require('../controllers/profileController')

const router = express.Router()

router.get('/', authMiddleware, fetchProfile)
router.put('/', authMiddleware, saveProfile)
router.put('/password', authMiddleware, updatePassword)

module.exports = router
