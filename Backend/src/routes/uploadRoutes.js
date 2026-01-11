const express = require('express')
const router = express.Router()
// Note: This duplicate file exists due to path casing. The active route is mounted from the 'Unihall' tree.
router.get('/noop', (req, res) => res.json({ ok: true }))
module.exports = router
