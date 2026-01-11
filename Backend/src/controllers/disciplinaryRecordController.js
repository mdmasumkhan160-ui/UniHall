const {
  createDisciplinaryRecord,
  listDisciplinaryRecordsByHall,
  getDisciplinaryRecordById,
  updateDisciplinaryRecord,
  deleteDisciplinaryRecord,
} = require("../repositories/disciplinaryRecordRepository");
const { initPool } = require("../../config/db");

function role(user) {
  return String(user?.role || "").toLowerCase();
}

async function searchStudents(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can search students");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const query = req.query.q || "";
    const searchTerm = `%${query}%`;

    const pool = await initPool();
    const [students] = await pool.query(
      `SELECT sp.userId, sp.universityId, u.name, u.email, sp.department
       FROM student_profiles sp
       LEFT JOIN users u ON u.userId = sp.userId
       WHERE sp.hallId = ?
         AND (sp.universityId LIKE ? OR u.name LIKE ?)
       ORDER BY sp.universityId ASC
       LIMIT 20`,
      [hallId, searchTerm, searchTerm]
    );

    res.json({ success: true, data: students });
  } catch (e) {
    next(e);
  }
}

async function addDisciplinaryRecord(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can add disciplinary records");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const body = req.body || {};
    const {
      studentId,
      title,
      details,
      severity,
      actionTaken,
      incidentDate,
      attachmentId,
    } = body;

    const data = await createDisciplinaryRecord({
      studentId,
      hallId,
      title,
      details,
      severity,
      actionTaken,
      incidentDate,
      attachmentId: attachmentId || null,
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listDisciplinaryRecords(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can view disciplinary records");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const { studentId, severity } = req.query || {};
    const filters = {};
    if (studentId) filters.studentId = studentId;
    if (severity) filters.severity = severity;

    const data = await listDisciplinaryRecordsByHall(hallId, filters);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function getDisciplinaryRecord(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can view disciplinary records");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const recordId = req.params.recordId;
    const data = await getDisciplinaryRecordById(recordId, hallId);

    if (!data) {
      const err = new Error("Record not found");
      err.status = 404;
      throw err;
    }

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function updateRecord(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can update disciplinary records");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const recordId = req.params.recordId;
    const updates = {
      ...req.body,
      updatedBy: req.user.userId,
    };

    const data = await updateDisciplinaryRecord(recordId, hallId, updates);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function deleteRecord(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can delete disciplinary records");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const recordId = req.params.recordId;
    const data = await deleteDisciplinaryRecord(recordId, hallId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  addDisciplinaryRecord,
  listDisciplinaryRecords,
  getDisciplinaryRecord,
  updateRecord,
  deleteRecord,
  searchStudents,
};
