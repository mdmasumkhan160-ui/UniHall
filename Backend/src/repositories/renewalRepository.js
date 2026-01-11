const { initPool } = require("../../config/db");
const { v4: uuid } = require("uuid");
const {
  computeEffectiveExpiryDate,
  addMonthsSafe,
} = require("../utils/allocationExpiry");

function toPositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i <= 0) return null;
  return i;
}

function normalizeStatus(input) {
  const raw = String(input || "")
    .trim()
    .toUpperCase();
  if (!raw) return null;
  if (
    raw === "PENDING" ||
    raw === "UNDER_REVIEW" ||
    raw === "APPROVED" ||
    raw === "REJECTED"
  )
    return raw;
  return null;
}

async function getActiveAllocationForStudent(studentId) {
  if (!studentId) return null;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT sa.allocationId,
            sa.studentId,
            sa.status AS allocationStatus,
            sa.startDate,
            sa.endDate,
            sa.created_at,
            sa.updated_at,
            r.roomId,
            r.roomNumber,
            r.hallId,
            sp.sessionYear
       FROM student_allocations sa
       JOIN rooms r ON r.roomId = sa.roomId
       LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
      WHERE sa.studentId = ?
        AND sa.status IN ('ALLOCATED','ACTIVE')
      ORDER BY COALESCE(sa.updated_at, sa.created_at) DESC
      LIMIT 1`,
    [studentId]
  );

  if (!rows.length) return null;
  const row = rows[0];
  return {
    allocationId: row.allocationId,
    studentId: row.studentId,
    status: row.allocationStatus,
    startDate: row.startDate,
    endDate: row.endDate,
    sessionYear: row.sessionYear || null,
    room: {
      roomId: row.roomId,
      roomNumber: row.roomNumber,
      hallId: row.hallId,
    },
  };
}

async function findPendingRenewal(allocationId, academicYear) {
  if (!allocationId || !academicYear) return null;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT renewalId
       FROM renewals
      WHERE allocationId = ?
        AND academicYear = ?
        AND status IN ('PENDING','UNDER_REVIEW')
      LIMIT 1`,
    [allocationId, academicYear]
  );
  return rows[0] ? rows[0].renewalId : null;
}

async function getRenewalByAllocationAndYear(allocationId, academicYear) {
  if (!allocationId || !academicYear) return null;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT renewalId, status
       FROM renewals
      WHERE allocationId = ? AND academicYear = ?
      ORDER BY applicationDate DESC, created_at DESC
      LIMIT 1`,
    [allocationId, academicYear]
  );
  return rows[0] || null;
}

async function createRenewalRequest({
  studentId,
  allocationId,
  academicYear,
  remarks = null,
  attachment = null,
}) {
  if (!studentId || !allocationId || !academicYear) {
    const err = new Error(
      "studentId, allocationId and academicYear are required"
    );
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  const renewalId = uuid();
  let attachmentId = null;

  try {
    await connection.beginTransaction();

    if (attachment && attachment.url) {
      attachmentId = uuid();
      const fileName = attachment.name || "attachment";
      const fileType = attachment.type || "application/octet-stream";
      await connection.query(
        `INSERT INTO attachments (attachmentId, entityType, entityId, fileName, fileType, fileUrl, created_at, created_by)
         VALUES (?, 'RENEWAL', ?, ?, ?, ?, NOW(), ?)`,
        [attachmentId, renewalId, fileName, fileType, attachment.url, studentId]
      );
    }

    await connection.query(
      `INSERT INTO renewals (renewalId, studentId, allocationId, academicYear, status, applicationDate, reviewedBy, reviewedAt, approvedAt, rejectionReason, attachmentId, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', NOW(), NULL, NULL, NULL, NULL, ?, ?, NOW(), NOW())`,
      [renewalId, studentId, allocationId, academicYear, attachmentId, remarks]
    );

    await connection.commit();

    return {
      renewalId,
      attachmentId,
    };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function listRenewalsByStudent(studentId) {
  if (!studentId) return [];
  const pool = await initPool();

  const [rows] = await pool.query(
    `SELECT r.renewalId,
            r.studentId,
            r.allocationId,
            r.academicYear,
            r.status,
            r.applicationDate,
            r.reviewedBy,
            r.reviewedAt,
            r.approvedAt,
            r.rejectionReason,
            r.remarks,
            att.fileName,
            att.fileType,
            att.fileUrl,
            rm.hallId,
            rm.roomNumber
       FROM renewals r
       JOIN student_allocations sa ON sa.allocationId = r.allocationId
       JOIN rooms rm ON rm.roomId = sa.roomId
       LEFT JOIN attachments att ON att.attachmentId = r.attachmentId
      WHERE r.studentId = ?
      ORDER BY r.applicationDate DESC, r.created_at DESC`,
    [studentId]
  );

  return rows.map((r) => ({
    id: r.renewalId,
    studentId: r.studentId,
    allocationId: r.allocationId,
    academicYear: r.academicYear,
    status: r.status,
    appliedAt: r.applicationDate,
    reviewedBy: r.reviewedBy,
    reviewedAt: r.reviewedAt,
    approvedAt: r.approvedAt,
    rejectionReason: r.rejectionReason,
    remarks: r.remarks,
    room: {
      hallId: r.hallId,
      roomNumber: r.roomNumber,
    },
    attachment: r.fileUrl
      ? { name: r.fileName, type: r.fileType, url: r.fileUrl }
      : null,
  }));
}

async function listRenewalsByHall(hallId) {
  if (!hallId) return [];
  const pool = await initPool();

  const [rows] = await pool.query(
    `SELECT r.renewalId,
            r.studentId,
            r.allocationId,
            r.academicYear,
            r.status,
            r.applicationDate,
            r.reviewedBy,
            r.reviewedAt,
            r.approvedAt,
            r.rejectionReason,
            r.remarks,
            u.name AS studentName,
            u.email AS studentEmail,
            sp.universityId AS studentUniversityId,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear,
            rm.roomNumber,
            att.fileName,
            att.fileType,
            att.fileUrl
       FROM renewals r
       JOIN student_allocations sa ON sa.allocationId = r.allocationId
       JOIN rooms rm ON rm.roomId = sa.roomId
       LEFT JOIN users u ON u.userId = r.studentId
       LEFT JOIN student_profiles sp ON sp.userId = r.studentId
       LEFT JOIN attachments att ON att.attachmentId = r.attachmentId
      WHERE rm.hallId = ?
      ORDER BY CASE r.status
                 WHEN 'PENDING' THEN 0
                 WHEN 'UNDER_REVIEW' THEN 1
                 WHEN 'APPROVED' THEN 2
                 WHEN 'REJECTED' THEN 3
                 ELSE 99
               END,
               r.applicationDate DESC`,
    [hallId]
  );

  return rows.map((r) => ({
    id: r.renewalId,
    studentId: r.studentId,
    allocationId: r.allocationId,
    academicYear: r.academicYear,
    status: r.status,
    requestedAt: r.applicationDate,
    reviewedBy: r.reviewedBy,
    reviewedAt: r.reviewedAt,
    approvedAt: r.approvedAt,
    rejectionReason: r.rejectionReason,
    remarks: r.remarks,
    roomNumber: r.roomNumber,
    student: {
      userId: r.studentId,
      name: r.studentName || "Unknown",
      email: r.studentEmail || "N/A",
      studentId: r.studentUniversityId || r.studentId,
      department: r.studentDepartment || null,
      session: r.studentSessionYear || null,
    },
    attachment: r.fileUrl
      ? { name: r.fileName, type: r.fileType, url: r.fileUrl }
      : null,
  }));
}

async function getRenewalByIdForHall(renewalId, hallId) {
  if (!renewalId || !hallId) return null;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT r.renewalId,
            r.studentId,
            r.allocationId,
            r.academicYear,
            r.status,
            r.applicationDate,
            r.reviewedBy,
            r.reviewedAt,
            r.approvedAt,
            r.rejectionReason,
            r.remarks,
            rm.hallId
       FROM renewals r
       JOIN student_allocations sa ON sa.allocationId = r.allocationId
       JOIN rooms rm ON rm.roomId = sa.roomId
      WHERE r.renewalId = ? AND rm.hallId = ?
      LIMIT 1`,
    [renewalId, hallId]
  );
  return rows[0] || null;
}

async function updateRenewalDecisionForHall({
  renewalId,
  hallId,
  status,
  reviewedBy,
  note,
  extendMonths,
}) {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    const err = new Error("Invalid status");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();

  const trimmedNote = typeof note === "string" ? note.trim() : "";
  let nextRemarks = null;
  if (trimmedNote) {
    const prefix = nextRemarks ? `${nextRemarks}\n` : "";
    nextRemarks = `${prefix}Admin: ${trimmedNote}`;
  }

  const rejectionReason =
    normalized === "REJECTED" ? trimmedNote || "Rejected" : null;
  const approvedAt = normalized === "APPROVED" ? new Date() : null;

  try {
    await connection.beginTransaction();

    const [[row]] = await connection.query(
      `SELECT r.renewalId,
              r.studentId,
              r.allocationId,
              r.academicYear,
              r.remarks,
              sa.startDate AS allocationStartDate,
              sa.endDate AS allocationEndDate,
              sp.sessionYear
         FROM renewals r
         JOIN student_allocations sa ON sa.allocationId = r.allocationId
         JOIN rooms rm ON rm.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE r.renewalId = ? AND rm.hallId = ?
        LIMIT 1
        FOR UPDATE`,
      [renewalId, hallId]
    );

    if (!row) {
      const err = new Error("Renewal request not found for your hall");
      err.status = 404;
      throw err;
    }

    // Merge new note into existing remarks
    nextRemarks = row.remarks || null;
    if (trimmedNote) {
      const prefix = nextRemarks ? `${nextRemarks}\n` : "";
      nextRemarks = `${prefix}Admin: ${trimmedNote}`;
    }

    await connection.query(
      `UPDATE renewals
          SET status = ?,
              reviewedBy = ?,
              reviewedAt = NOW(),
              approvedAt = ?,
              rejectionReason = ?,
              remarks = ?,
              updated_at = NOW()
        WHERE renewalId = ?`,
      [
        normalized,
        reviewedBy || null,
        approvedAt,
        rejectionReason,
        nextRemarks,
        renewalId,
      ]
    );

    let newExpiresAt = null;
    let appliedExtendMonths = null;
    if (normalized === "APPROVED") {
      const months = toPositiveInt(extendMonths) || 12;
      if (months > 60) {
        const err = new Error("extendMonths is too large");
        err.status = 400;
        throw err;
      }

      const baseExpiry = computeEffectiveExpiryDate({
        sessionYear: row.sessionYear,
        startDate: row.allocationStartDate,
        endDate: row.allocationEndDate,
      });
      if (!baseExpiry || Number.isNaN(new Date(baseExpiry).getTime())) {
        const err = new Error(
          "Unable to determine current seat expiry date for this allocation"
        );
        err.status = 400;
        throw err;
      }

      const extended = addMonthsSafe(baseExpiry, months);
      if (!extended) {
        const err = new Error("Failed to compute extended expiry date");
        err.status = 400;
        throw err;
      }

      await connection.query(
        `UPDATE student_allocations
            SET endDate = ?, updated_at = NOW()
          WHERE allocationId = ?`,
        [extended, row.allocationId]
      );

      newExpiresAt = extended.toISOString();
      appliedExtendMonths = months;
    }

    await connection.commit();
    return {
      renewalId,
      status: normalized,
      studentId: row.studentId,
      academicYear: row.academicYear,
      expiresAt: newExpiresAt,
      extendMonths: appliedExtendMonths,
    };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

module.exports = {
  getActiveAllocationForStudent,
  findPendingRenewal,
  getRenewalByAllocationAndYear,
  createRenewalRequest,
  listRenewalsByStudent,
  listRenewalsByHall,
  updateRenewalDecisionForHall,
};
