const { initPool } = require("../../config/db");
const { v4: uuid } = require("uuid");

async function resolveStudentId(studentIdInput, hallId) {
  if (!studentIdInput) return null;

  const pool = await initPool();
  const searchTerm = String(studentIdInput).trim();

  // First try: Look for student in this specific hall
  const [hallRows] = await pool.query(
    `SELECT sp.userId, sp.universityId, sp.hallId
     FROM student_profiles sp
     WHERE (UPPER(sp.userId) = UPPER(?) OR UPPER(sp.universityId) = UPPER(?))
       AND sp.hallId = ?
     LIMIT 1`,
    [searchTerm, searchTerm, hallId]
  );

  if (hallRows.length > 0) {
    return hallRows[0].userId;
  }

  // Second try: Look for the student anywhere in the database to provide better error
  const [allRows] = await pool.query(
    `SELECT sp.userId, sp.universityId, sp.hallId, h.hallName
     FROM student_profiles sp
     LEFT JOIN halls h ON h.hallId = sp.hallId
     WHERE UPPER(sp.userId) = UPPER(?) OR UPPER(sp.universityId) = UPPER(?)
     LIMIT 1`,
    [searchTerm, searchTerm]
  );

  if (allRows.length > 0) {
    const err = new Error(
      `Student "${searchTerm}" is assigned to ${allRows[0].hallName || 'another hall'}, not your current hall. Please verify the student belongs to your hall.`
    );
    err.status = 400;
    throw err;
  }

  // Student not found anywhere
  const err = new Error(
    `Student "${searchTerm}" not found in the system. Please verify the student ID/university ID is correct.`
  );
  err.status = 400;
  throw err;
}

async function createDisciplinaryRecord({
  studentId,
  hallId,
  title,
  details,
  severity,
  actionTaken,
  incidentDate,
  attachmentId = null,
  createdBy,
}) {
  if (!studentId || !hallId || !title || !details || !severity || !actionTaken || !incidentDate) {
    const err = new Error("Missing required fields");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const recordId = uuid();
  const createdAt = new Date();

  try {
    // Resolve studentId (could be userId or universityId) to actual userId
    const resolvedStudentId = await resolveStudentId(studentId, hallId);

    await pool.query(
      `INSERT INTO disciplinary_records 
       (recordId, studentId, hallId, title, details, severity, actionTaken, incidentDate, attachmentId, status, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), ?)`,
      [
        recordId,
        resolvedStudentId,
        hallId,
        title,
        details,
        severity,
        actionTaken,
        incidentDate,
        attachmentId,
        createdBy,
      ]
    );

    return {
      recordId,
      studentId: resolvedStudentId,
      hallId,
      title,
      details,
      severity,
      actionTaken,
      incidentDate,
      status: "ACTIVE",
      createdAt,
      createdBy,
    };
  } catch (err) {
    throw err;
  }
}

async function listDisciplinaryRecordsByHall(hallId, filters = {}) {
  if (!hallId) return [];

  const pool = await initPool();
  let query = `
    SELECT dr.recordId, dr.studentId, dr.hallId, dr.title, dr.details, 
           dr.severity, dr.actionTaken, dr.incidentDate, dr.status,
           dr.created_at, dr.updated_at, dr.created_by, dr.updated_by,
           u.name AS studentName, u.email AS studentEmail,
           sp.universityId AS studentUniversityId
    FROM disciplinary_records dr
    LEFT JOIN users u ON u.userId = dr.studentId
    LEFT JOIN student_profiles sp ON sp.userId = dr.studentId
    WHERE dr.hallId = ? AND dr.status = 'ACTIVE'
  `;

  const params = [hallId];

  if (filters.studentId) {
    query += ` AND (dr.studentId = ? OR sp.universityId = ?)`;
    params.push(filters.studentId, filters.studentId);
  }

  if (filters.severity) {
    query += ` AND dr.severity = ?`;
    params.push(filters.severity);
  }

  query += ` ORDER BY dr.incidentDate DESC, dr.created_at DESC`;

  try {
    const [rows] = await pool.query(query, params);

    return rows.map((r) => ({
      recordId: r.recordId,
      studentId: r.studentId,
      studentName: r.studentName || "Unknown",
      studentEmail: r.studentEmail || "N/A",
      studentUniversityId: r.studentUniversityId || r.studentId,
      hallId: r.hallId,
      title: r.title,
      details: r.details,
      severity: r.severity,
      actionTaken: r.actionTaken,
      incidentDate: r.incidentDate,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by,
      updatedBy: r.updated_by,
    }));
  } catch (err) {
    throw err;
  }
}

async function getDisciplinaryRecordById(recordId, hallId) {
  const pool = await initPool();

  try {
    const [rows] = await pool.query(
      `SELECT dr.recordId, dr.studentId, dr.hallId, dr.title, dr.details,
              dr.severity, dr.actionTaken, dr.incidentDate, dr.status,
              dr.created_at, dr.updated_at, dr.created_by, dr.updated_by,
              u.name AS studentName, u.email AS studentEmail,
              sp.universityId AS studentUniversityId
       FROM disciplinary_records dr
       LEFT JOIN users u ON u.userId = dr.studentId
       LEFT JOIN student_profiles sp ON sp.userId = dr.studentId
       WHERE dr.recordId = ? AND dr.hallId = ?`,
      [recordId, hallId]
    );

    if (!rows.length) return null;

    const r = rows[0];
    return {
      recordId: r.recordId,
      studentId: r.studentId,
      studentName: r.studentName || "Unknown",
      studentEmail: r.studentEmail || "N/A",
      studentUniversityId: r.studentUniversityId || r.studentId,
      hallId: r.hallId,
      title: r.title,
      details: r.details,
      severity: r.severity,
      actionTaken: r.actionTaken,
      incidentDate: r.incidentDate,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by,
      updatedBy: r.updated_by,
    };
  } catch (err) {
    throw err;
  }
}

async function updateDisciplinaryRecord(recordId, hallId, updates) {
  const pool = await initPool();

  const allowedFields = ["title", "details", "severity", "actionTaken", "incidentDate"];
  const updateFields = {};

  for (const field of allowedFields) {
    if (field in updates) {
      updateFields[field] = updates[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    const err = new Error("No valid fields to update");
    err.status = 400;
    throw err;
  }

  const setClause = Object.keys(updateFields)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(updateFields);

  try {
    const [result] = await pool.query(
      `UPDATE disciplinary_records 
       SET ${setClause}, updated_at = NOW(), updated_by = ?
       WHERE recordId = ? AND hallId = ?`,
      [...values, updates.updatedBy || null, recordId, hallId]
    );

    if (result.affectedRows === 0) {
      const err = new Error("Record not found");
      err.status = 404;
      throw err;
    }

    return getDisciplinaryRecordById(recordId, hallId);
  } catch (err) {
    throw err;
  }
}

async function deleteDisciplinaryRecord(recordId, hallId) {
  const pool = await initPool();

  try {
    const [result] = await pool.query(
      `UPDATE disciplinary_records 
       SET status = 'DELETED', updated_at = NOW()
       WHERE recordId = ? AND hallId = ?`,
      [recordId, hallId]
    );

    if (result.affectedRows === 0) {
      const err = new Error("Record not found");
      err.status = 404;
      throw err;
    }

    return { success: true, recordId };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createDisciplinaryRecord,
  listDisciplinaryRecordsByHall,
  getDisciplinaryRecordById,
  updateDisciplinaryRecord,
  deleteDisciplinaryRecord,
  resolveStudentId,
};
