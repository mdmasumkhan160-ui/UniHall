const { initPool } = require("../../config/db");

function role(user) {
  return String(user?.role || "").toLowerCase();
}

async function getStudentProfile(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can view student profiles");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const studentIdParam = String(req.params.studentId || "").trim();
    if (!studentIdParam) {
      const err = new Error("studentId is required");
      err.status = 400;
      throw err;
    }

    const pool = await initPool();
    const [rows] = await pool.query(
      `SELECT u.userId,
              u.name,
              u.email,

              sp.userId AS studentUserId,
              sp.hallId,
              sp.universityId,
              sp.programLevel,
              sp.phone,
              sp.address,
              sp.department,
              sp.sessionYear,
              sp.photoUrl,
              sp.studentIdCardUrl,

              h.hallName,
              h.hallCode
         FROM student_profiles sp
         LEFT JOIN users u ON u.userId = sp.userId
         LEFT JOIN halls h ON h.hallId = sp.hallId
        WHERE sp.userId = ? OR sp.universityId = ?
        LIMIT 1`,
      [studentIdParam, studentIdParam]
    );

    const row = rows[0];
    if (!row) {
      const err = new Error("Student not found");
      err.status = 404;
      throw err;
    }

    if (String(row.hallId || "") !== String(hallId || "")) {
      const err = new Error("Student is not in your hall");
      err.status = 403;
      throw err;
    }

    const data = {
      userId: row.userId || row.studentUserId,
      name: row.name || "Unknown",
      email: row.email || "N/A",
      studentId: row.universityId || row.studentUserId,
      universityId: row.universityId || null,
      programLevel: row.programLevel || null,
      phone: row.phone || null,
      address: row.address || null,
      department: row.department || null,
      sessionYear: row.sessionYear || null,
      photoUrl: row.photoUrl || null,
      studentIdCardUrl: row.studentIdCardUrl || null,
      hall: {
        hallId: row.hallId,
        hallName: row.hallName || null,
        hallCode: row.hallCode || null,
      },
    };

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = { getStudentProfile };
