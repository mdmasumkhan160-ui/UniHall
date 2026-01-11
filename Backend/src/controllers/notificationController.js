const {
  listNotificationsByUser,
  markNotificationRead,
  createNotification,
  getCurrentResidentHallIdForStudent,
} = require("../repositories/notificationRepository");
const { findHallByCode } = require("../repositories/userRepository");

async function listMyNotifications(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    // For students, show hall-wide broadcasts only if they are a CURRENT resident
    // (i.e., have an active/non-vacated/non-expired allocation).
    let hallId = req.user.hallId || null;
    const role = String(req.user.role || "").toUpperCase();
    if (role === "STUDENT") {
      hallId = await getCurrentResidentHallIdForStudent(req.user.userId);
      // Backward compatible fallback: if we couldn't resolve current residency,
      // keep hallId null (so they still see global + direct notifications).
    } else if (!hallId && req.user.studentId) {
      const code = String(req.user.studentId).slice(0, 3).toUpperCase();
      try {
        hallId = await findHallByCode(code);
      } catch (_) {
        hallId = null;
      }
    }
    const data = await listNotificationsByUser(req.user.userId, hallId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    const data = await markNotificationRead(req.params.id, req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyNotifications, markRead };

async function createBroadcast(req, res, next) {
  try {
    if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "admin")) {
      const err = new Error("Only admins can publish notifications");
      err.status = 403;
      throw err;
    }
    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }
    const { title, body } = req.body || {};
    if (!title || !String(title).trim() || !body || !String(body).trim()) {
      const err = new Error("Title and body are required");
      err.status = 400;
      throw err;
    }
    const result = await createNotification({
      hallId,
      userId: null,
      title,
      body,
    });
    if (!result.success) {
      const err = new Error(result.error || "Failed to create notification");
      err.status = 500;
      throw err;
    }
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports.createBroadcast = createBroadcast;
