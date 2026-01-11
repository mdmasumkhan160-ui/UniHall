const {
  listFormsByHall,
  getFormById,
  createForm,
  updateForm,
  setFormActive,
  findActiveFormByHall,
  createApplicationWithResponse,
  hasActiveAllocation,
  hasApplicationForStudent,
  deleteForm,
  listApplicationsByForm,
  listApplicationsByStudent,
  updateApplicationStatus,
} = require("../repositories/formRepository");
const { initPool } = require("../../config/db");

async function createNotification({ userId, hallId, title, body }) {
  const pool = await initPool();
  try {
    await pool.query(
      `INSERT INTO notifications (notificationId, hallId, userId, title, body, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        require("uuid").v4(),
        hallId || null,
        userId || null,
        title || "Update",
        body || "",
      ]
    );
  } catch (_) {
    // notifications table may not exist; ignore
  }
}
const { deriveSessionYearFromStudentId } = require("./authService");

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}
const { findHallByCode } = require("../repositories/userRepository");

function ensureAdmin(user) {
  if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
    const err = new Error("Only hall administrators can manage forms");
    err.status = 403;
    throw err;
  }
}

function ensureStudent(user) {
  if (!user || (user.role !== "STUDENT" && user.role !== "student")) {
    const err = new Error("Only students can submit applications");
    err.status = 403;
    throw err;
  }
}

function normalizeSchemaInput(schema = []) {
  if (!Array.isArray(schema)) return [];
  return schema.map((field, index) => {
    const options = Array.isArray(field.options)
      ? field.options
      : typeof field.optionsText === "string"
      ? field.optionsText
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    const requiresDocument = !!field.requiresDocument;
    const documentRequirement = requiresDocument
      ? String(field.documentRequirement || "MANDATORY").toUpperCase()
      : "RECOMMENDED";

    return {
      id: field.id || null,
      label: field.label ? String(field.label).trim() : `Field ${index + 1}`,
      type: field.type || "text",
      required: !!field.required,
      options,
      score: Number.isFinite(Number(field.score)) ? Number(field.score) : 0,
      requiresDocument,
      documentLabel:
        requiresDocument && field.documentLabel
          ? String(field.documentLabel).trim()
          : null,
      documentRequirement:
        documentRequirement === "RECOMMENDED" ? "RECOMMENDED" : "MANDATORY",
      displayOrder: Number.isFinite(parseInt(field.displayOrder, 10))
        ? parseInt(field.displayOrder, 10)
        : index,
    };
  });
}

function normalizeSessionYearsInput(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

async function listHallForms(user) {
  ensureAdmin(user);
  return listFormsByHall(user.hallId);
}

async function createHallForm(user, payload = {}) {
  ensureAdmin(user);
  const title = payload.name || payload.title;
  if (!title || !String(title).trim()) {
    const err = new Error("Form title is required");
    err.status = 400;
    throw err;
  }

  const sessionYears = normalizeSessionYearsInput(
    payload.sessionYears ?? payload.sessionYear
  );
  if (!sessionYears.length) {
    const err = new Error("At least one session year is required");
    err.status = 400;
    throw err;
  }

  const schema = normalizeSchemaInput(payload.schema);
  if (!schema.length) {
    const err = new Error("At least one field is required");
    err.status = 400;
    throw err;
  }

  const form = await createForm({
    hallId: user.hallId,
    sessionYears,
    title: String(title).trim(),
    isActive: false,
    applicationDeadline: payload.applicationDeadline || null,
    schema,
    createdBy: user.userId,
  });

  if (payload.active) {
    await setFormActive(form.id, user.hallId, true, user.userId);
    return getFormById(form.id);
  }

  return form;
}

async function updateHallForm(user, formId, payload = {}) {
  ensureAdmin(user);
  const title = payload.name || payload.title;
  if (!title || !String(title).trim()) {
    const err = new Error("Form title is required");
    err.status = 400;
    throw err;
  }

  const sessionYears = normalizeSessionYearsInput(
    payload.sessionYears ?? payload.sessionYear
  );
  if (!sessionYears.length) {
    const err = new Error("At least one session year is required");
    err.status = 400;
    throw err;
  }

  const schema = normalizeSchemaInput(payload.schema);
  if (!schema.length) {
    const err = new Error("At least one field is required");
    err.status = 400;
    throw err;
  }

  const form = await updateForm(formId, {
    hallId: user.hallId,
    sessionYears,
    title: String(title).trim(),
    isActive: !!payload.active,
    applicationDeadline: payload.applicationDeadline || null,
    schema,
    updatedBy: user.userId,
  });

  if (payload.active) {
    await setFormActive(form.id, user.hallId, true, user.userId);
    return getFormById(form.id);
  }

  return form;
}

async function setHallFormActive(user, formId, isActive) {
  ensureAdmin(user);
  return setFormActive(formId, user.hallId, !!isActive, user.userId);
}

async function deleteHallForm(user, formId) {
  ensureAdmin(user);
  await deleteForm(formId, user.hallId);
}

async function listFormApplications(user, formId) {
  ensureAdmin(user);
  const form = await getFormById(formId);
  if (!form || form.hallId !== user.hallId) {
    const err = new Error("Form not found for your hall");
    err.status = 404;
    throw err;
  }
  return listApplicationsByForm(formId, user.hallId);
}

function normalizeStatus(input, hasSeat = false) {
  if (hasSeat) return "alloted";
  const raw = String(input || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  switch (raw) {
    case "submitted":
      return "submitted";
    case "interview scheduled":
    case "scheduled":
      return "scheduled";
    case "seat allocated":
    case "allocated":
    case "alloted":
    case "allotted":
      return "alloted";
    case "not-alloted":
    case "not allotted":
    case "not_allocated":
    case "not allocated":
      return "not-alloted";
    case "rejected":
      return "rejected";
    case "selected":
      // Not part of final statuses; keep as scheduled until seat is assigned
      return "scheduled";
    default:
      return raw;
  }
}

async function updateFormApplicationStatus(
  user,
  formId,
  applicationId,
  payload = {}
) {
  ensureAdmin(user);
  const form = await getFormById(formId);
  if (!form || form.hallId !== user.hallId) {
    const err = new Error("Form not found for your hall");
    err.status = 404;
    throw err;
  }
  const seat = payload.seat || null;
  const status = normalizeStatus(payload.status, !!seat);
  const interview = payload.interview || null;
  const result = await updateApplicationStatus({
    applicationId,
    hallId: user.hallId,
    status,
    interview,
    seat,
  });

  // Notify student on interview scheduling
  if (status === "scheduled" && interview) {
    const formLabel = form?.title || form?.name || formId;
    await createNotification({
      userId: result.studentId,
      hallId: user.hallId,
      title: "Interview Scheduled",
      body: `Your interview for "${formLabel}" is scheduled on ${interview.date} at ${interview.time} in ${interview.venue}.`,
    });
  }

  return result;
}

function validateSubmission(form, payload) {
  const answers = payload.data || {};
  const attachments = payload.attachments || {};

  if (!form || !Array.isArray(form.schema)) {
    const err = new Error("Form is not configured");
    err.status = 400;
    throw err;
  }

  const missing = [];
  const missingDocuments = [];

  form.schema.forEach((field) => {
    const value = answers[field.id];
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && String(value).trim() !== "";

    if (field.required && !hasValue) {
      missing.push(field.label);
    }

    if (field.requiresDocument) {
      const attachment = attachments[field.id];
      const hasDoc = attachment && attachment.url;
      const requirement = (
        field.documentRequirement || "MANDATORY"
      ).toUpperCase();
      if (requirement === "MANDATORY" && !hasDoc) {
        missingDocuments.push(field.documentLabel || field.label || field.id);
      }
    }
  });

  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if (missingDocuments.length) {
    const err = new Error(
      `Missing required documents: ${missingDocuments.join(", ")}`
    );
    err.status = 400;
    throw err;
  }
}

function calculateScore(form, answers) {
  return form.schema.reduce((total, field) => {
    const value = answers[field.id];
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && String(value).trim() !== "";
    return total + (hasValue ? Number(field.score) || 0 : 0);
  }, 0);
}

async function resolveHallId(user) {
  if (user?.hallId) return user.hallId;
  // Masters/PhD accounts should not infer hall from the universityId format.
  if (isUuid(user?.userId)) return null;
  const sid = user?.studentId || user?.userId;
  if (!sid || sid.length < 3) return null;
  const code = String(sid).slice(0, 3).toUpperCase();
  try {
    const hallId = await findHallByCode(code);
    return hallId || null;
  } catch (e) {
    return null;
  }
}

async function getActiveFormForStudent(user) {
  ensureStudent(user);

  console.log("🔍 [DEBUG] Student eligibility check:", {
    userId: user.userId,
    studentId: user.studentId,
    hallId: user.hallId,
  });

  const hallId = await resolveHallId(user);
  if (!hallId) {
    console.log("❌ [DEBUG] No hallId for student (and fallback failed)");
    return null;
  }

  const isGraduateAccount = isUuid(user.userId);
  const studentSession = isGraduateAccount
    ? user.sessionYear || null
    : deriveSessionYearFromStudentId(user.studentId || user.userId);
  console.log("🔍 [DEBUG] Derived student session:", studentSession);

  if (!studentSession) {
    console.log("❌ [DEBUG] Unable to derive session");
    return null;
  }

  const alreadyAllocated = await hasActiveAllocation(user.userId);
  console.log("🔍 [DEBUG] Already allocated:", alreadyAllocated);

  if (alreadyAllocated) {
    console.log("❌ [DEBUG] Student already has active allocation");
    return null;
  }

  const form = await findActiveFormByHall(hallId);
  console.log(
    "🔍 [DEBUG] Found active form:",
    form
      ? {
          id: form.id,
          hallId: form.hallId,
          sessionYears: form.sessionYears,
        }
      : null
  );

  if (!form) {
    console.log("❌ [DEBUG] No active form found for hall:", hallId);
    return null;
  }

  const sessions = Array.isArray(form.sessionYears) ? form.sessionYears : [];
  console.log("🔍 [DEBUG] Form sessions:", sessions);
  console.log("🔍 [DEBUG] Student session:", studentSession);
  console.log("🔍 [DEBUG] Session match:", sessions.includes(studentSession));

  if (sessions.length && !sessions.includes(studentSession)) {
    console.log(
      "❌ [DEBUG] Session mismatch - student session not in form sessions"
    );
    return null;
  }

  console.log("✅ [DEBUG] Student is eligible for form");
  return form;
}

async function submitFormResponse(user, formId, payload = {}) {
  ensureStudent(user);
  const form = await getFormById(formId);
  const hallId = await resolveHallId(user);
  if (!form || !hallId || form.hallId !== hallId) {
    const err = new Error("Form not found for your hall");
    err.status = 404;
    throw err;
  }

  if (!form.isActive) {
    const err = new Error("This form is not accepting responses");
    err.status = 400;
    throw err;
  }

  const isGraduateAccount = isUuid(user.userId);
  const studentSession = isGraduateAccount
    ? user.sessionYear || null
    : deriveSessionYearFromStudentId(user.studentId || user.userId);
  if (!studentSession) {
    const err = new Error("Unable to determine your session");
    err.status = 400;
    throw err;
  }

  const formSessions = Array.isArray(form.sessionYears)
    ? form.sessionYears
    : [];
  if (formSessions.length && !formSessions.includes(studentSession)) {
    const err = new Error(
      "This application form is not available for your session"
    );
    err.status = 403;
    throw err;
  }

  if (await hasActiveAllocation(user.userId)) {
    const err = new Error(
      "Seat already assigned. You cannot submit a new application."
    );
    err.status = 400;
    throw err;
  }

  if (await hasApplicationForStudent(form.id, user.userId)) {
    const err = new Error(
      "You have already submitted an application for this form"
    );
    err.status = 400;
    throw err;
  }

  validateSubmission(form, payload);

  const answers = payload.data || {};
  const attachments = payload.attachments || {};
  const totalScore = calculateScore(form, answers);

  return createApplicationWithResponse({
    studentId: user.userId,
    hallId,
    form,
    answers,
    attachments,
    totalScore,
  });
}

async function listStudentApplications(user) {
  ensureStudent(user);
  return listApplicationsByStudent(user.userId);
}

module.exports = {
  listHallForms,
  createHallForm,
  updateHallForm,
  setHallFormActive,
  getActiveFormForStudent,
  submitFormResponse,
  deleteHallForm,
  listFormApplications,
  updateFormApplicationStatus,
  listStudentApplications,
};
