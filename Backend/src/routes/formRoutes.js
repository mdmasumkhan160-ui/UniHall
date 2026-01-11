const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const {
  listForms,
  createForm,
  updateForm,
  setActive,
  fetchActiveForm,
  submitResponse,
  deleteForm,
  listApplications,
  listMyApplications,
  updateApplicationStatus
} = require('../controllers/formController')

const router = express.Router()

router.use(authMiddleware)

router.get('/active', fetchActiveForm)
router.post('/:formId/submit', submitResponse)

// student-focused aliases for clarity on the frontend
router.get('/student/active', fetchActiveForm)
router.post('/student/:formId/submit', submitResponse)
router.get('/student/applications', listMyApplications)

router.get('/', listForms)
router.post('/', createForm)
router.put('/:formId', updateForm)
router.post('/:formId/publish', setActive)
router.get('/:formId/applications', listApplications)
router.post('/:formId/applications/:applicationId/status', updateApplicationStatus)
// Debug endpoint: expose form eligibility evaluation (admin only)
router.get('/debug/student/:studentId', async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    const targetId = req.params.studentId
    // Temporarily fetch user via authService to reuse logic
    const { fetchCurrentUser } = require('../services/authService')
    const { getActiveFormForStudent } = require('../services/formService')
    const student = await fetchCurrentUser(targetId)
    const form = await getActiveFormForStudent(student)
    res.json({ success: true, student: { id: student.userId, hallId: student.hallId, session: student.session }, form })
  } catch (err) {
    next(err)
  }
})
router.delete('/:formId', deleteForm)

module.exports = router
