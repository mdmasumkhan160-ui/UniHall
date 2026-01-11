const { initPool } = require("../../config/db");
const crypto = require("crypto");

/**
 * Get exam controller profile by userId
 */
async function getExamControllerProfile(userId) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT 
      ecp.userId, 
      ecp.designation, 
      ecp.department, 
      ecp.officeLocation, 
      ecp.contactExt,
      ecp.phone,
      ecp.photoUrl,
      u.name,
      u.email,
      ecp.created_at,
      ecp.updated_at
    FROM exam_controller_profiles ecp
    LEFT JOIN users u ON u.userId = ecp.userId
    WHERE ecp.userId = ?`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Create or update exam controller profile
 */
async function upsertExamControllerProfile(data) {
  const pool = await initPool();
  const {
    userId,
    designation,
    department,
    officeLocation,
    contactExt,
    phone,
    photoUrl,
  } = data;

  await pool.query(
    `INSERT INTO exam_controller_profiles 
      (userId, designation, department, officeLocation, contactExt, phone, photoUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      designation = VALUES(designation),
      department = VALUES(department),
      officeLocation = VALUES(officeLocation),
      contactExt = VALUES(contactExt),
      phone = VALUES(phone),
      photoUrl = VALUES(photoUrl),
      updated_at = CURRENT_TIMESTAMP`,
    [userId, designation, department, officeLocation, contactExt, phone, photoUrl]
  );

  return getExamControllerProfile(userId);
}

/**
 * Create exam seat plan
 */
async function createSeatPlan(data) {
  const pool = await initPool();
  const planId = crypto.randomUUID();
  const {
    examName,
    examDate,
    semester,
    academicYear,
    department,
    description,
    isVisible,
    attachmentId,
    createdBy,
  } = data;

  await pool.query(
    `INSERT INTO exam_seat_plans 
      (planId, examName, examDate, semester, academicYear, department, description, isVisible, attachmentId, publishedAt, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      planId,
      examName,
      examDate,
      semester,
      academicYear,
      department,
      description,
      isVisible || 0,
      attachmentId,
      isVisible ? new Date() : null,
      createdBy,
    ]
  );

  return getSeatPlanById(planId);
}

/**
 * Get seat plan by ID
 */
async function getSeatPlanById(planId) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT 
      sp.planId,
      sp.examName,
      sp.examDate,
      sp.semester,
      sp.academicYear,
      sp.department,
      sp.description,
      sp.isVisible,
      sp.attachmentId,
      sp.publishedAt,
      sp.created_at,
      sp.created_by,
      a.fileName,
      a.fileType,
      a.fileUrl,
      u.name as createdByName
    FROM exam_seat_plans sp
    LEFT JOIN attachments a ON a.attachmentId = sp.attachmentId
    LEFT JOIN users u ON u.userId = sp.created_by
    WHERE sp.planId = ?`,
    [planId]
  );
  return rows[0] || null;
}

/**
 * List seat plans with filters
 */
async function listSeatPlans(filters = {}) {
  const pool = await initPool();
  const {
    semester,
    academicYear,
    department,
    isVisible,
    limit = 50,
    offset = 0,
  } = filters;

  // Build the common WHERE clause and parameters
  let where = ` WHERE 1=1 `;
  const params = [];

  if (semester) {
    where += ` AND sp.semester = ?`;
    params.push(semester);
  }

  if (academicYear) {
    where += ` AND sp.academicYear = ?`;
    params.push(academicYear);
  }

  if (department) {
    where += ` AND sp.department = ?`;
    params.push(department);
  }

  if (isVisible !== undefined) {
    where += ` AND sp.isVisible = ?`;
    params.push(isVisible ? 1 : 0);
  }

  // Query rows with limit/offset
  const rowsQuery = `
    SELECT 
      sp.planId,
      sp.examName,
      sp.examDate,
      sp.semester,
      sp.academicYear,
      sp.department,
      sp.description,
      sp.isVisible,
      sp.attachmentId,
      sp.publishedAt,
      sp.created_at,
      sp.created_by,
      a.fileName,
      a.fileType,
      a.fileUrl,
      u.name as createdByName
    FROM exam_seat_plans sp
    LEFT JOIN attachments a ON a.attachmentId = sp.attachmentId
    LEFT JOIN users u ON u.userId = sp.created_by
    ${where}
    ORDER BY sp.examDate DESC, sp.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(rowsQuery, [...params, limit, offset]);

  // Query total count for the same filters
  const countQuery = `SELECT COUNT(*) as total FROM exam_seat_plans sp ${where}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0] ? countRows[0].total : 0;

  return { rows, count: total };
}

/**
 * Update seat plan
 */
async function updateSeatPlan(planId, data) {
  const pool = await initPool();
  const { examName, examDate, semester, academicYear, department, description, isVisible } = data;

  const updates = [];
  const params = [];

  if (examName !== undefined) {
    updates.push("examName = ?");
    params.push(examName);
  }
  if (examDate !== undefined) {
    updates.push("examDate = ?");
    params.push(examDate);
  }
  if (semester !== undefined) {
    updates.push("semester = ?");
    params.push(semester);
  }
  if (academicYear !== undefined) {
    updates.push("academicYear = ?");
    params.push(academicYear);
  }
  if (department !== undefined) {
    updates.push("department = ?");
    params.push(department);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }
  if (isVisible !== undefined) {
    updates.push("isVisible = ?");
    params.push(isVisible ? 1 : 0);
    if (isVisible) {
      updates.push("publishedAt = CURRENT_TIMESTAMP");
    }
  }

  if (updates.length === 0) {
    return getSeatPlanById(planId);
  }

  params.push(planId);
  await pool.query(
    `UPDATE exam_seat_plans SET ${updates.join(", ")} WHERE planId = ?`,
    params
  );

  return getSeatPlanById(planId);
}

/**
 * Delete seat plan
 */
async function deleteSeatPlan(planId) {
  const pool = await initPool();
  await pool.query(`DELETE FROM exam_seat_plans WHERE planId = ?`, [planId]);
  return true;
}

/**
 * Create exam result
 */
async function createExamResult(data) {
  const pool = await initPool();
  const resultId = crypto.randomUUID();
  const {
    semester,
    academicYear,
    department,
    title,
    description,
    isVisible,
    attachmentId,
    createdBy,
  } = data;

  await pool.query(
    `INSERT INTO exam_results 
      (resultId, semester, academicYear, department, title, description, isVisible, attachmentId, publishedAt, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resultId,
      semester,
      academicYear,
      department,
      title,
      description,
      isVisible || 0,
      attachmentId,
      isVisible ? new Date() : null,
      createdBy,
    ]
  );

  return getExamResultById(resultId);
}

/**
 * Get exam result by ID
 */
async function getExamResultById(resultId) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT 
      er.resultId,
      er.semester,
      er.academicYear,
      er.department,
      er.title,
      er.description,
      er.isVisible,
      er.attachmentId,
      er.publishedAt,
      er.created_at,
      er.updated_at,
      er.created_by,
      a.fileName,
      a.fileType,
      a.fileUrl,
      u.name as createdByName
    FROM exam_results er
    LEFT JOIN attachments a ON a.attachmentId = er.attachmentId
    LEFT JOIN users u ON u.userId = er.created_by
    WHERE er.resultId = ?`,
    [resultId]
  );
  return rows[0] || null;
}

/**
 * List exam results with filters
 */
async function listExamResults(filters = {}) {
  const pool = await initPool();
  const {
    semester,
    academicYear,
    department,
    isVisible,
    limit = 50,
    offset = 0,
  } = filters;

  let where = ` WHERE 1=1 `;
  const params = [];

  if (semester) {
    where += ` AND er.semester = ?`;
    params.push(semester);
  }

  if (academicYear) {
    where += ` AND er.academicYear = ?`;
    params.push(academicYear);
  }

  if (department) {
    where += ` AND er.department = ?`;
    params.push(department);
  }

  if (isVisible !== undefined) {
    where += ` AND er.isVisible = ?`;
    params.push(isVisible ? 1 : 0);
  }

  const rowsQuery = `
    SELECT 
      er.resultId,
      er.semester,
      er.academicYear,
      er.department,
      er.title,
      er.description,
      er.isVisible,
      er.attachmentId,
      er.publishedAt,
      er.created_at,
      er.updated_at,
      er.created_by,
      a.fileName,
      a.fileType,
      a.fileUrl,
      u.name as createdByName
    FROM exam_results er
    LEFT JOIN attachments a ON a.attachmentId = er.attachmentId
    LEFT JOIN users u ON u.userId = er.created_by
    ${where}
    ORDER BY er.publishedAt DESC, er.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(rowsQuery, [...params, limit, offset]);

  const countQuery = `SELECT COUNT(*) as total FROM exam_results er ${where}`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0] ? countRows[0].total : 0;

  return { rows, count: total };
}

/**
 * Update exam result
 */
async function updateExamResult(resultId, data) {
  const pool = await initPool();
  const { semester, academicYear, department, title, description, isVisible } = data;

  const updates = [];
  const params = [];

  if (semester !== undefined) {
    updates.push("semester = ?");
    params.push(semester);
  }
  if (academicYear !== undefined) {
    updates.push("academicYear = ?");
    params.push(academicYear);
  }
  if (department !== undefined) {
    updates.push("department = ?");
    params.push(department);
  }
  if (title !== undefined) {
    updates.push("title = ?");
    params.push(title);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }
  if (isVisible !== undefined) {
    updates.push("isVisible = ?");
    params.push(isVisible ? 1 : 0);
    if (isVisible) {
      updates.push("publishedAt = CURRENT_TIMESTAMP");
    }
  }

  if (updates.length === 0) {
    return getExamResultById(resultId);
  }

  params.push(resultId);
  await pool.query(
    `UPDATE exam_results SET ${updates.join(", ")} WHERE resultId = ?`,
    params
  );

  return getExamResultById(resultId);
}

/**
 * Delete exam result
 */
async function deleteExamResult(resultId) {
  const pool = await initPool();
  await pool.query(`DELETE FROM exam_results WHERE resultId = ?`, [resultId]);
  return true;
}

/**
 * Create attachment record
 */
async function createAttachment(data) {
  const pool = await initPool();
  const attachmentId = crypto.randomUUID();
  const { entityType, entityId, fileName, fileType, fileUrl, createdBy } = data;

  await pool.query(
    `INSERT INTO attachments 
      (attachmentId, entityType, entityId, fileName, fileType, fileUrl, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [attachmentId, entityType, entityId, fileName, fileType, fileUrl, createdBy]
  );

  return attachmentId;
}

/**
 * Get distinct departments from student profiles
 */
async function getDistinctDepartments() {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT DISTINCT department FROM student_profiles WHERE department IS NOT NULL ORDER BY department`
  );
  return rows.map((r) => r.department);
}

/**
 * Get distinct academic years (session years in format YYYY-YYYY)
 */
async function getDistinctAcademicYears() {
  // Return predefined session year options
  return [
    '2021-2022',
    '2022-2023',
    '2023-2024',
    '2024-2025',
    '2025-2026'
  ];
}

/**
 * Get distinct semesters (predefined semester options)
 */
async function getDistinctSemesters() {
  // Return predefined semester options
  return [
    '1-1',
    '1-2',
    '2-1',
    '2-2',
    '3-1',
    '3-2',
    '4-1',
    '4-2'
  ];
}

module.exports = {
  getExamControllerProfile,
  upsertExamControllerProfile,
  createSeatPlan,
  getSeatPlanById,
  listSeatPlans,
  updateSeatPlan,
  deleteSeatPlan,
  createExamResult,
  getExamResultById,
  listExamResults,
  updateExamResult,
  deleteExamResult,
  createAttachment,
  getDistinctDepartments,
  getDistinctAcademicYears,
  getDistinctSemesters,
};
