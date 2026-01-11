const {
  listHallForms,
  createHallForm,
  updateHallForm,
  setHallFormActive,
  getActiveFormForStudent,
  submitFormResponse,
  deleteHallForm,
  listFormApplications,
  listStudentApplications,
  updateFormApplicationStatus
} = require('../services/formService')

async function listForms(req, res, next) {
  try {
    const data = await listHallForms(req.user)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function createForm(req, res, next) {
  try {
    const data = await createHallForm(req.user, req.body || {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function updateFormHandler(req, res, next) {
  try {
    const data = await updateHallForm(req.user, req.params.formId, req.body || {})
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function setActive(req, res, next) {
  try {
    const { active } = req.body || {}
    const data = await setHallFormActive(req.user, req.params.formId, !!active)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function fetchActiveForm(req, res, next) {
  try {
    const data = await getActiveFormForStudent(req.user)
    if (!data) {
      return res.status(404).json({ success: false, message: 'No active application form available' })
    }
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function submitResponse(req, res, next) {
  try {
    const data = await submitFormResponse(req.user, req.params.formId, req.body || {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function deleteForm(req, res, next) {
  try {
    await deleteHallForm(req.user, req.params.formId)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

async function listApplications(req, res, next) {
  try {
    const data = await listFormApplications(req.user, req.params.formId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function listMyApplications(req, res, next) {
  try {
    const data = await listStudentApplications(req.user)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const data = await updateFormApplicationStatus(req.user, req.params.formId, req.params.applicationId, req.body || {})
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listForms,
  createForm,
  updateForm: updateFormHandler,
  setActive,
  fetchActiveForm,
  submitResponse,
  deleteForm
  ,
  listApplications,
  listMyApplications
  ,
  updateApplicationStatus
}
