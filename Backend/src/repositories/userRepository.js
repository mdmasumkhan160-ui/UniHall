const { initPool } = require("../../config/db");

async function getPool() {
  return initPool();
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    userId: row.userId,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    hallId: row.adminHallId || row.staffHallId || row.studentHallId || null,
    studentId: row.studentUniversityId || null,
    sessionYear: row.studentSessionYear || null,
    lastLogin: row.lastLogin,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function findUserByEmail(email) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.*, ap.hallId AS adminHallId, sp.hallId AS staffHallId, stp.hallId AS studentHallId, stp.universityId AS studentUniversityId, stp.sessionYear AS studentSessionYear
     FROM users u
     LEFT JOIN admin_profiles ap ON ap.userId = u.userId
     LEFT JOIN staff_profiles sp ON sp.userId = u.userId
     LEFT JOIN student_profiles stp ON stp.userId = u.userId
     WHERE LOWER(u.email) = ?
     LIMIT 1`,
    [email]
  );
  return mapUserRow(rows[0]);
}

async function findUserByEmailOrStudentId(email, identifier) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.*, ap.hallId AS adminHallId, sp.hallId AS staffHallId, stp.hallId AS studentHallId, stp.universityId AS studentUniversityId, stp.sessionYear AS studentSessionYear
     FROM users u
     LEFT JOIN admin_profiles ap ON ap.userId = u.userId
     LEFT JOIN staff_profiles sp ON sp.userId = u.userId
     LEFT JOIN student_profiles stp ON stp.userId = u.userId
  WHERE LOWER(u.email) = ? OR (UPPER(u.userId) = ? AND u.role = 'STUDENT') OR stp.universityId = ?
     LIMIT 1`,
    [email, identifier, identifier]
  );
  return mapUserRow(rows[0]);
}

async function findUserById(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.*, ap.hallId AS adminHallId, sp.hallId AS staffHallId, stp.hallId AS studentHallId, stp.universityId AS studentUniversityId
     FROM users u
     LEFT JOIN admin_profiles ap ON ap.userId = u.userId
     LEFT JOIN staff_profiles sp ON sp.userId = u.userId
     LEFT JOIN student_profiles stp ON stp.userId = u.userId
     WHERE u.userId = ?
     LIMIT 1`,
    [userId]
  );
  return mapUserRow(rows[0]);
}

async function updateLastLogin(userId) {
  const pool = await getPool();
  await pool.query("UPDATE users SET lastLogin = NOW() WHERE userId = ?", [
    userId,
  ]);
}

async function createStudentUser({
  userId,
  email,
  hashedPassword,
  name,
  hallId,
  studentId,
  programLevel,
  department,
  sessionYear,
}) {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO users (userId, email, password, name, role, isEmailVerified, isActive, created_at)
       VALUES (?, ?, ?, ?, 'STUDENT', 0, 1, NOW())`,
      [userId, email, hashedPassword, name]
    );

    await connection.query(
      `INSERT INTO student_profiles (userId, hallId, universityId, programLevel, phone, address, department, sessionYear, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        hallId,
        studentId,
        programLevel || null,
        "0000000000",
        "Not provided",
        department,
        sessionYear,
      ]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function findHallByCode(code) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT hallId FROM halls WHERE hallCode = ? LIMIT 1",
    [code]
  );
  return rows[0] ? rows[0].hallId : null;
}

async function findStudentProfileByUserId(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT sp.userId, sp.hallId, h.hallName, h.hallCode, sp.universityId, sp.programLevel, sp.phone, sp.address, sp.department, sp.sessionYear, sp.photoUrl, sp.studentIdCardUrl, sp.created_at, sp.updated_at
     FROM student_profiles sp
     LEFT JOIN halls h ON h.hallId = sp.hallId
     WHERE sp.userId = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsertStudentProfile(userId, profile) {
  const pool = await getPool();
  const {
    hallId = null,
    universityId = null,
    programLevel = null,
    phone = null,
    address = null,
    department = null,
    sessionYear = null,
    photoUrl = null,
    studentIdCardUrl = null,
  } = profile;

  await pool.query(
    `INSERT INTO student_profiles (userId, hallId, universityId, programLevel, phone, address, department, sessionYear, photoUrl, studentIdCardUrl, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       hallId = COALESCE(VALUES(hallId), hallId),
       universityId = COALESCE(VALUES(universityId), universityId),
       programLevel = COALESCE(VALUES(programLevel), programLevel),
       phone = VALUES(phone),
       address = VALUES(address),
       department = VALUES(department),
       sessionYear = VALUES(sessionYear),
       photoUrl = VALUES(photoUrl),
       studentIdCardUrl = VALUES(studentIdCardUrl),
       updated_at = NOW()`,
    [
      userId,
      hallId,
      universityId,
      programLevel,
      phone,
      address,
      department,
      sessionYear,
      photoUrl,
      studentIdCardUrl,
    ]
  );

  return findStudentProfileByUserId(userId);
}

async function findAdminProfileByUserId(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT ap.userId, ap.hallId, h.hallName, h.hallCode, ap.designation, ap.officeLocation, ap.phone, ap.photoUrl, ap.created_at, ap.updated_at
     FROM admin_profiles ap
     LEFT JOIN halls h ON h.hallId = ap.hallId
     WHERE ap.userId = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsertAdminProfile(userId, profile) {
  const pool = await getPool();
  const {
    hallId = null,
    designation = null,
    officeLocation = null,
    phone = null,
    photoUrl = null,
  } = profile;

  await pool.query(
    `INSERT INTO admin_profiles (userId, hallId, designation, officeLocation, phone, photoUrl, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       hallId = VALUES(hallId),
       designation = VALUES(designation),
       officeLocation = VALUES(officeLocation),
       phone = VALUES(phone),
       photoUrl = VALUES(photoUrl),
       updated_at = NOW()`,
    [userId, hallId, designation, officeLocation, phone, photoUrl]
  );

  return findAdminProfileByUserId(userId);
}

async function findStaffProfileByUserId(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT sp.userId, sp.hallId, h.hallName, h.hallCode, sp.contact, sp.phone, sp.photoUrl, sp.created_at, sp.updated_at
     FROM staff_profiles sp
     LEFT JOIN halls h ON h.hallId = sp.hallId
     WHERE sp.userId = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsertStaffProfile(userId, profile) {
  const pool = await getPool();
  const {
    hallId = null,
    contact = null,
    phone = null,
    photoUrl = null,
  } = profile;

  await pool.query(
    `INSERT INTO staff_profiles (userId, hallId, contact, phone, photoUrl, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       hallId = VALUES(hallId),
       contact = VALUES(contact),
       phone = VALUES(phone),
       photoUrl = VALUES(photoUrl),
       updated_at = NOW()`,
    [userId, hallId, contact, phone, photoUrl]
  );

  return findStaffProfileByUserId(userId);
}

async function findExamControllerProfileByUserId(userId) {
  const pool = await getPool();
  // `exam_controller_profiles` uses `contactExt` column name in DB. Alias as `contact` so code continues to expect `contact`.
  const [rows] = await pool.query(
    `SELECT ep.userId, ep.contactExt AS contact, ep.phone, ep.photoUrl, ep.created_at, ep.updated_at
     FROM exam_controller_profiles ep
     WHERE ep.userId = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsertExamControllerProfile(userId, profile) {
  const pool = await getPool();
  const { contact = null, phone = null, photoUrl = null } = profile;

  // Store incoming `contact` value into `contactExt` column in DB
  await pool.query(
    `INSERT INTO exam_controller_profiles (userId, contactExt, phone, photoUrl, created_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       contactExt = VALUES(contactExt),
       phone = VALUES(phone),
       photoUrl = VALUES(photoUrl),
       updated_at = NOW()`,
    [userId, contact, phone, photoUrl]
  );

  return findExamControllerProfileByUserId(userId);
}

async function updateUserBasicInfo(userId, fields) {
  const updates = [];
  const values = [];

  if (fields.name !== undefined) {
    const name = fields.name && String(fields.name).trim();
    updates.push("name = ?");
    values.push(name || null);
  }

  if (fields.email !== undefined) {
    const email = fields.email && String(fields.email).trim().toLowerCase();
    updates.push("email = ?");
    values.push(email || null);
  }

  if (!updates.length) {
    return;
  }

  updates.push("updated_at = NOW()");
  const pool = await getPool();
  await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE userId = ?`, [
    ...values,
    userId,
  ]);
}

async function updateUserPassword(userId, hashedPassword) {
  const pool = await getPool();
  await pool.query(
    "UPDATE users SET password = ?, updated_at = NOW() WHERE userId = ?",
    [hashedPassword, userId]
  );
}

module.exports = {
  findUserByEmail,
  findUserByEmailOrStudentId,
  findUserById,
  updateLastLogin,
  createStudentUser,
  findHallByCode,
  findStudentProfileByUserId,
  upsertStudentProfile,
  findAdminProfileByUserId,
  upsertAdminProfile,
  findStaffProfileByUserId,
  upsertStaffProfile,
  findExamControllerProfileByUserId,
  upsertExamControllerProfile,
  updateUserBasicInfo,
  updateUserPassword,
};
