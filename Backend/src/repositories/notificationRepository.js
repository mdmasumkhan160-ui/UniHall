const { initPool } = require("../../config/db");

async function getCurrentResidentHallIdForStudent(studentId) {
  if (!studentId) return null;
  const pool = await initPool();
  try {
    const [rows] = await pool.query(
      `SELECT r.hallId
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE sa.studentId = ?
          AND sa.status IN ('ALLOCATED','ACTIVE')
          AND sa.vacatedDate IS NULL
          AND sa.startDate <= NOW()
          AND (sa.endDate IS NULL OR sa.endDate >= NOW())
        ORDER BY COALESCE(sa.updated_at, sa.created_at) DESC
        LIMIT 1`,
      [studentId]
    );
    return rows?.[0]?.hallId || null;
  } catch (_) {
    return null;
  }
}

function extractLegacyInterviewFormId(body) {
  if (!body) return null;
  const text = String(body);
  const match = /Your\s+interview\s+for\s+form\s+([0-9a-fA-F-]{36})\b/.exec(
    text
  );
  return match?.[1] || null;
}

function replaceLegacyInterviewBody(body, formTitle) {
  if (!body || !formTitle) return body;
  const text = String(body);
  return text.replace(
    /Your\s+interview\s+for\s+form\s+[0-9a-fA-F-]{36}\b/,
    `Your interview for "${formTitle}"`
  );
}

async function listNotificationsByUser(userId, hallId = null, limit = 50) {
  const pool = await initPool();
  try {
    const [rows] = await pool.query(
      `SELECT notificationId AS id, title, body, created_at AS createdAt
         FROM notifications
        WHERE (userId = ?)
           OR (userId IS NULL AND (? IS NOT NULL AND hallId = ?))
           OR (userId IS NULL AND hallId IS NULL)
        ORDER BY created_at DESC
        LIMIT ?`,
      [userId, hallId, hallId, Number(limit) || 50]
    );

    // Patch legacy Interview Scheduled notifications that embed formId in body.
    const formIds = Array.from(
      new Set(
        rows
          .filter((r) => r?.title === "Interview Scheduled")
          .map((r) => extractLegacyInterviewFormId(r.body))
          .filter(Boolean)
      )
    );

    let titleByFormId = new Map();
    if (formIds.length) {
      const [formRows] = await pool.query(
        `SELECT formId, formTitle FROM application_forms WHERE formId IN (?)`,
        [formIds]
      );
      titleByFormId = new Map(
        (formRows || []).map((r) => [r.formId, r.formTitle])
      );
    }

    return rows.map((r) => {
      const legacyFormId =
        r?.title === "Interview Scheduled"
          ? extractLegacyInterviewFormId(r.body)
          : null;
      const formTitle = legacyFormId ? titleByFormId.get(legacyFormId) : null;
      const patchedBody = formTitle
        ? replaceLegacyInterviewBody(r.body, formTitle)
        : r.body;
      return {
        id: r.id,
        title: r.title,
        body: patchedBody,
        createdAt: r.createdAt,
      };
    });
  } catch (err) {
    // If table missing, return empty list gracefully
    return [];
  }
}

async function markNotificationRead(notificationId, userId) {
  const pool = await initPool();
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE notificationId = ? AND (userId = ? OR userId IS NULL)`,
      [notificationId, userId]
    );
  } catch (err) {
    // ignore if column/table missing
  }
  return { id: notificationId, read: true };
}

module.exports = { listNotificationsByUser, markNotificationRead };

async function createNotification({
  userId = null,
  hallId = null,
  title,
  body,
}) {
  const pool = await initPool();
  try {
    const { v4: uuid } = require("uuid");
    await pool.query(
      `INSERT INTO notifications (notificationId, hallId, userId, title, body, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        uuid(),
        hallId || null,
        userId || null,
        String(title || "").trim(),
        String(body || "").trim(),
      ]
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports.createNotification = createNotification;

module.exports.getCurrentResidentHallIdForStudent =
  getCurrentResidentHallIdForStudent;
