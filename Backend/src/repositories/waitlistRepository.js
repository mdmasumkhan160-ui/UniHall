const { initPool } = require("../../config/db");
const { v4: uuid } = require("uuid");

function isTruthyString(value) {
  return (
    value !== null && value !== undefined && String(value).trim().length > 0
  );
}

async function recomputeActivePositions(connection, hallId) {
  // NOTE: `waitlist_entries` has a UNIQUE index on (hallId, position) that applies
  // to ALL rows (ACTIVE/INACTIVE/DELETED). If an INACTIVE/DELETED row holds position=1,
  // then re-ranking ACTIVE rows to 1..N will fail unless we move non-active rows out first.
  const [allRows] = await connection.query(
    `SELECT entryId, status, position
       FROM waitlist_entries
      WHERE hallId = ?
      FOR UPDATE`,
    [hallId]
  );

  let maxPosition = 0;
  for (const r of allRows) {
    const p = Number(r.position || 0);
    if (p > maxPosition) maxPosition = p;
  }

  // 1) Move non-active rows to unique positions above current max.
  const nonActive = allRows.filter((r) => String(r.status) !== "ACTIVE");
  for (const r of nonActive) {
    maxPosition += 1;
    await connection.query(
      `UPDATE waitlist_entries
          SET position = ?, updated_at = NOW()
        WHERE hallId = ? AND entryId = ?`,
      [maxPosition, hallId, r.entryId]
    );
  }

  // 2) Get ACTIVE rows in the correct order.
  const [activeRows] = await connection.query(
    `SELECT entryId
       FROM waitlist_entries
      WHERE hallId = ? AND status = 'ACTIVE'
      ORDER BY score DESC, addedAt ASC, entryId ASC
      FOR UPDATE`,
    [hallId]
  );

  // 3) Assign temporary unique positions to ACTIVE rows (avoid conflicts between ACTIVE updates).
  for (const r of activeRows) {
    maxPosition += 1;
    await connection.query(
      `UPDATE waitlist_entries
          SET position = ?, updated_at = NOW()
        WHERE hallId = ? AND entryId = ? AND status = 'ACTIVE'`,
      [maxPosition, hallId, r.entryId]
    );
  }

  // 4) Now assign final 1..N positions.
  for (let i = 0; i < activeRows.length; i += 1) {
    await connection.query(
      `UPDATE waitlist_entries
          SET position = ?, updated_at = NOW()
        WHERE hallId = ? AND entryId = ? AND status = 'ACTIVE'`,
      [i + 1, hallId, activeRows[i].entryId]
    );
  }
}

async function addToWaitlist({ hallId, applicationId }) {
  if (!isTruthyString(hallId) || !isTruthyString(applicationId)) {
    const err = new Error("hallId and applicationId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[app]] = await connection.query(
      `SELECT a.applicationId, a.studentId, a.hallId
         FROM applications a
        WHERE a.applicationId = ? AND a.hallId = ?
        FOR UPDATE`,
      [applicationId, hallId]
    );

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const [[existing]] = await connection.query(
      `SELECT entryId
         FROM waitlist_entries
        WHERE hallId = ? AND applicationId = ? AND status = 'ACTIVE'
        LIMIT 1
        FOR UPDATE`,
      [hallId, applicationId]
    );

    if (existing?.entryId) {
      const err = new Error("Already in waiting list");
      err.status = 409;
      throw err;
    }

    const [[alreadyAllocated]] = await connection.query(
      `SELECT allocationId
         FROM student_allocations
        WHERE applicationId = ?
          AND status IN ('ALLOCATED','ACTIVE')
          AND roomId IS NOT NULL
        LIMIT 1`,
      [applicationId]
    );

    if (alreadyAllocated?.allocationId) {
      const err = new Error("Student already has an active allocation");
      err.status = 409;
      throw err;
    }

    const [[scoreRow]] = await connection.query(
      `SELECT COALESCE(a.totalScore, 0) + COALESCE(i.interviewScore, 0) AS totalScore
         FROM applications a
         LEFT JOIN interviews i ON i.applicationId = a.applicationId
        WHERE a.applicationId = ? AND a.hallId = ?
        LIMIT 1`,
      [applicationId, hallId]
    );

    const totalScore = Number(scoreRow?.totalScore || 0);

    // Insert with a guaranteed-unique position first (then we re-rank by score).
    const [[posRow]] = await connection.query(
      `SELECT COALESCE(MAX(position), 0) AS maxPos
         FROM waitlist_entries
        WHERE hallId = ?
        FOR UPDATE`,
      [hallId]
    );

    const position = Number(posRow?.maxPos || 0) + 1;
    const entryId = uuid();

    await connection.query(
      `INSERT INTO waitlist_entries (
        entryId,
        studentId,
        hallId,
        applicationId,
        position,
        score,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [entryId, app.studentId, hallId, applicationId, position, totalScore]
    );

    await recomputeActivePositions(connection, hallId);

    const [[computedRow]] = await connection.query(
      `SELECT position
         FROM waitlist_entries
        WHERE hallId = ? AND entryId = ?
        LIMIT 1`,
      [hallId, entryId]
    );

    const computedPosition = Number(computedRow?.position || 0);

    await connection.commit();
    return {
      entryId,
      applicationId,
      studentId: app.studentId,
      hallId,
      position: computedPosition,
      score: totalScore,
      status: "ACTIVE",
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function listWaitlistByHallId(hallId, studentIdQuery = "") {
  if (!isTruthyString(hallId)) {
    const err = new Error("hallId is required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const q = String(studentIdQuery || "").trim();
  const like = `%${q}%`;

  const params = [hallId];
  let filter = "";
  if (q) {
    filter = " AND (sp.universityId LIKE ? OR wl.studentId LIKE ?)";
    params.push(like, like);
  }

  const [rows] = await pool.query(
    `SELECT wl.entryId,
            wl.applicationId,
            wl.studentId,
            wl.position,
            wl.score,
            wl.status,
            wl.addedAt,
            wl.removedAt,
            wl.removalReason,

            u.name AS studentName,
            u.email AS studentEmail,
            sp.universityId AS studentUniversityId,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear
       FROM waitlist_entries wl
       LEFT JOIN users u ON u.userId = wl.studentId
       LEFT JOIN student_profiles sp ON sp.userId = wl.studentId
      WHERE wl.hallId = ?
        AND wl.status = 'ACTIVE'
        ${filter}
      ORDER BY COALESCE(wl.score, 0) DESC, wl.addedAt ASC, wl.entryId ASC`,
    params
  );

  return rows.map((r, idx) => ({
    entryId: r.entryId,
    applicationId: r.applicationId,
    position: idx + 1,
    score: r.score === null || r.score === undefined ? null : Number(r.score),
    addedAt: r.addedAt,
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

async function getWaitlistEntry(hallId, entryId) {
  if (!isTruthyString(hallId) || !isTruthyString(entryId)) {
    const err = new Error("hallId and entryId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const [[row]] = await pool.query(
    `SELECT entryId, hallId, applicationId, studentId, status
       FROM waitlist_entries
      WHERE entryId = ? AND hallId = ?
      LIMIT 1`,
    [entryId, hallId]
  );

  return row || null;
}

async function removeWaitlistEntries({ hallId, entryIds, reason }) {
  if (!isTruthyString(hallId)) {
    const err = new Error("hallId is required");
    err.status = 400;
    throw err;
  }

  const ids = Array.isArray(entryIds) ? entryIds.filter(isTruthyString) : [];
  if (!ids.length) {
    const err = new Error("entryIds is required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE waitlist_entries
          SET status = 'DELETED',
              removedAt = NOW(),
              removalReason = ?,
              updated_at = NOW()
        WHERE hallId = ?
          AND entryId IN (?)
          AND status = 'ACTIVE'`,
      [cleanReason || null, hallId, ids]
    );

    await recomputeActivePositions(connection, hallId);
    await connection.commit();

    return { updated: result?.affectedRows || 0 };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function markWaitlistEntryAssigned({ hallId, entryId }) {
  if (!isTruthyString(hallId) || !isTruthyString(entryId)) {
    const err = new Error("hallId and entryId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `UPDATE waitlist_entries
          SET status = 'INACTIVE', removedAt = NOW(), updated_at = NOW()
        WHERE hallId = ? AND entryId = ? AND status = 'ACTIVE'`,
      [hallId, entryId]
    );

    await recomputeActivePositions(connection, hallId);
    await connection.commit();

    return { updated: result?.affectedRows || 0 };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  addToWaitlist,
  listWaitlistByHallId,
  getWaitlistEntry,
  removeWaitlistEntries,
  markWaitlistEntryAssigned,
};
