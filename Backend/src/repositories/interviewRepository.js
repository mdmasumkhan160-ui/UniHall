const { initPool } = require("../../config/db");

function toNullableScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return num;
}

async function listInterviewsByHallId(hallId) {
  const pool = await initPool();

  const [rows] = await pool.query(
    `SELECT i.interviewId,
            i.applicationId,
            i.date,
            i.time,
            i.venue,
            i.interviewScore,
            i.created_at,

            a.studentId,
            a.formId,
            a.status AS applicationStatus,
            a.submissionDate,
            a.totalScore,

            f.formTitle,

            u.name AS studentName,
            u.email AS studentEmail,
            sp.universityId AS studentUniversityId,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear
       FROM interviews i
       JOIN applications a ON a.applicationId = i.applicationId
       LEFT JOIN application_forms f ON f.formId = a.formId
       LEFT JOIN users u ON u.userId = a.studentId
       LEFT JOIN student_profiles sp ON sp.userId = a.studentId
      WHERE a.hallId = ?
        AND i.status = 0
      ORDER BY i.date ASC, i.time ASC, i.created_at DESC`,
    [hallId]
  );

  return rows.map((r) => ({
    interviewId: r.interviewId,
    applicationId: r.applicationId,
    date: r.date,
    time: r.time,
    venue: r.venue,
    interviewScore:
      r.interviewScore === null || r.interviewScore === undefined
        ? null
        : Number(r.interviewScore),
    createdAt: r.created_at,
    application: {
      applicationId: r.applicationId,
      formId: r.formId,
      formTitle: r.formTitle || null,
      status: r.applicationStatus,
      submittedAt: r.submissionDate,
      score: Number(r.totalScore || 0),
    },
    student: {
      userId: r.studentId,
      name: r.studentName || "Unknown",
      email: r.studentEmail || "N/A",
      studentId: r.studentUniversityId || r.studentId,
      department: r.studentDepartment || null,
      session: r.studentSessionYear || null,
    },
  }));
}

async function updateInterviewScoreByHallId({
  interviewId,
  hallId,
  interviewScore,
  updatedBy,
}) {
  if (!interviewId || !hallId) {
    const err = new Error("interviewId and hallId are required");
    err.status = 400;
    throw err;
  }

  const score = toNullableScore(interviewScore);
  if (Number.isNaN(score)) {
    const err = new Error("interviewScore must be a number");
    err.status = 400;
    throw err;
  }
  if (score !== null && (score < 0 || score > 100)) {
    const err = new Error("interviewScore must be between 0 and 100");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const [result] = await pool.query(
    `UPDATE interviews i
        JOIN applications a ON a.applicationId = i.applicationId
        SET i.interviewScore = ?,
            i.status = 1,
            i.updated_at = NOW()
      WHERE i.interviewId = ?
        AND a.hallId = ?`,
    [score, interviewId, hallId]
  );

  if (!result.affectedRows) {
    const err = new Error("Interview not found");
    err.status = 404;
    throw err;
  }

  return { interviewId, interviewScore: score, updatedBy: updatedBy || null };
}

async function getInterviewApplicationMetaByHallId(interviewId, hallId) {
  if (!interviewId || !hallId) {
    const err = new Error("interviewId and hallId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT i.interviewId, i.applicationId, a.formId
       FROM interviews i
       JOIN applications a ON a.applicationId = i.applicationId
      WHERE i.interviewId = ?
        AND a.hallId = ?
      LIMIT 1`,
    [interviewId, hallId]
  );

  if (!rows.length) {
    const err = new Error("Interview not found");
    err.status = 404;
    throw err;
  }

  return {
    interviewId: rows[0].interviewId,
    applicationId: rows[0].applicationId,
    formId: rows[0].formId,
  };
}

module.exports = {
  listInterviewsByHallId,
  updateInterviewScoreByHallId,
  getInterviewApplicationMetaByHallId,
};
