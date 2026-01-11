const { initPool } = require("../../config/db");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const path = require("path");

function normalizeStudentStatusToDb(input) {
  const raw = String(input || "")
    .trim()
    .toUpperCase();
  if (!raw) return null;
  if (
    [
      "SUBMITTED",
      "ACKNOWLEDGED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REJECTED",
    ].includes(raw)
  )
    return raw;

  // UI-friendly aliases
  if (raw === "PENDING") return "SUBMITTED";
  if (raw === "WORKING") return "IN_PROGRESS";
  return null;
}

function mapDbStatusToUi(status) {
  const raw = String(status || "").toUpperCase();
  switch (raw) {
    case "SUBMITTED":
    case "ACKNOWLEDGED":
      return "Pending";
    case "IN_PROGRESS":
      return "Working";
    case "RESOLVED":
    case "CLOSED":
      return "Resolved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
}

async function getActiveAllocationForStudent(studentId) {
  if (!studentId) return null;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT sa.allocationId,
            sa.studentId,
            sa.status AS allocationStatus,
            rm.hallId,
            rm.roomNumber
       FROM student_allocations sa
       JOIN rooms rm ON rm.roomId = sa.roomId
      WHERE sa.studentId = ?
        AND sa.status IN ('ALLOCATED','ACTIVE')
      ORDER BY COALESCE(sa.updated_at, sa.created_at) DESC
      LIMIT 1`,
    [studentId]
  );
  if (!rows.length) return null;
  return {
    allocationId: rows[0].allocationId,
    hallId: rows[0].hallId,
    roomNumber: rows[0].roomNumber,
    status: rows[0].allocationStatus,
  };
}

async function createComplaint({
  studentId,
  title,
  description,
  category = "OTHER",
  priority = "MEDIUM",
  attachment = null,
}) {
  if (!studentId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  const safeTitle = String(title || "").trim();
  const safeDesc = String(description || "").trim();
  if (!safeTitle || !safeDesc) {
    const err = new Error("Title and description are required");
    err.status = 400;
    throw err;
  }

  const allocation = await getActiveAllocationForStudent(studentId);
  if (!allocation) {
    const err = new Error(
      "Complaints can only be filed by students with an active hall allocation"
    );
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  const complaintId = uuid();
  let attachmentId = null;

  try {
    await connection.beginTransaction();

    if (attachment && attachment.data) {
      attachmentId = uuid();
      const fileName = attachment.name || "attachment";
      const fileType = attachment.type || "application/octet-stream";
      
      // Create uploads/pending directory if it doesn't exist
      const uploadsDir = path.resolve(__dirname, '../../..', 'uploads', 'pending');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename to avoid conflicts
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      const uniqueFilename = `${nameWithoutExt}-${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Save file to disk
      fs.writeFileSync(filePath, attachment.data);
      
      const fileUrl = `/uploads/pending/${uniqueFilename}`;
      
      await connection.query(
        `INSERT INTO attachments (attachmentId, entityType, entityId, fileName, fileType, fileUrl, created_at, created_by)
         VALUES (?, 'COMPLAINT', ?, ?, ?, ?, NOW(), ?)`,
        [
          attachmentId,
          complaintId,
          fileName,
          fileType,
          fileUrl,
          studentId,
        ]
      );
    }

    await connection.query(
      `INSERT INTO complaints (complaintId, userId, hallId, title, description, category, priority, status, resolutionDetails, attachmentId, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', NULL, ?, NOW(), NOW(), ?)`,
      [
        complaintId,
        studentId,
        allocation.hallId,
        safeTitle,
        safeDesc,
        category,
        priority,
        attachmentId,
        studentId,
      ]
    );

    await connection.commit();

    return { complaintId };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function listComplaintsByStudent(studentId) {
  if (!studentId) return [];
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT c.complaintId,
            c.userId,
            c.hallId,
            c.title,
            c.description,
            c.category,
            c.priority,
            c.status,
            c.resolutionDetails,
            c.created_at,
            c.updated_at,
            att.fileName,
            att.fileType,
            att.fileUrl
       FROM complaints c
       LEFT JOIN attachments att ON att.attachmentId = c.attachmentId
      WHERE c.userId = ?
      ORDER BY c.created_at DESC`,
    [studentId]
  );

  return rows.map((r) => ({
    id: r.complaintId,
    userId: r.userId,
    hallId: r.hallId,
    title: r.title,
    body: r.description,
    category: r.category,
    priority: r.priority,
    status: mapDbStatusToUi(r.status),
    resolutionDetails: r.resolutionDetails || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    attachments: r.fileUrl
      ? [{ name: r.fileName, type: r.fileType, url: r.fileUrl }]
      : [],
  }));
}

async function listComplaintsByHall(hallId) {
  if (!hallId) return [];
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT c.complaintId,
            c.userId,
            c.hallId,
            c.title,
            c.description,
            c.category,
            c.priority,
            c.status,
            c.resolutionDetails,
            c.created_at,
            c.updated_at,
            u.name AS userName,
            u.email AS userEmail,
            sp.universityId AS studentUniversityId,
            att.fileName,
            att.fileType,
            att.fileUrl
       FROM complaints c
       LEFT JOIN users u ON u.userId = c.userId
       LEFT JOIN student_profiles sp ON sp.userId = c.userId
       LEFT JOIN attachments att ON att.attachmentId = c.attachmentId
      WHERE c.hallId = ?
      ORDER BY c.created_at DESC`,
    [hallId]
  );

  return rows.map((r) => ({
    id: r.complaintId,
    userId: r.userId,
    userName: r.userName || "Unknown",
    userEmail: r.userEmail || "N/A",
    studentId: r.studentUniversityId || r.userId,
    hallId: r.hallId,
    title: r.title,
    body: r.description,
    category: r.category,
    priority: r.priority,
    status: mapDbStatusToUi(r.status),
    resolutionDetails: r.resolutionDetails || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    attachments: r.fileUrl
      ? [{ name: r.fileName, type: r.fileType, url: r.fileUrl }]
      : [],
  }));
}

async function updateComplaintStatus({
  complaintId,
  hallId,
  status,
  resolutionDetails,
  updatedBy,
}) {
  const normalized = normalizeStudentStatusToDb(status);
  if (!normalized) {
    const err = new Error("Invalid status");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT complaintId FROM complaints WHERE complaintId = ? AND hallId = ? LIMIT 1`,
    [complaintId, hallId]
  );
  if (!rows.length) {
    const err = new Error("Complaint not found for your hall");
    err.status = 404;
    throw err;
  }

  const details =
    typeof resolutionDetails === "string" ? resolutionDetails.trim() : "";
  const resolvedAt =
    normalized === "RESOLVED" || normalized === "CLOSED" ? new Date() : null;

  await pool.query(
    `UPDATE complaints
        SET status = ?,
            resolutionDetails = ?,
            resolved_at = ?,
            updated_at = NOW(),
            updated_by = ?
      WHERE complaintId = ? AND hallId = ?`,
    [
      normalized,
      details || null,
      resolvedAt,
      updatedBy || null,
      complaintId,
      hallId,
    ]
  );

  return { complaintId, status: normalized };
}

module.exports = {
  getActiveAllocationForStudent,
  createComplaint,
  listComplaintsByStudent,
  listComplaintsByHall,
  updateComplaintStatus,
};
