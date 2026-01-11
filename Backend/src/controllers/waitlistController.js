const {
  addToWaitlist,
  listWaitlistByHallId,
  getWaitlistEntry,
  removeWaitlistEntries,
  markWaitlistEntryAssigned,
} = require("../repositories/waitlistRepository");

const {
  assignRoomToCandidate,
} = require("../repositories/allocationRepository");

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "admin";
}

async function listMyHallWaitlist(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view waiting list");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const studentId = String(req.query.studentId || "").trim();
    const data = await listWaitlistByHallId(hallId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function addMyHallWaitlistEntry(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can add to waiting list");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const body = req.body || {};
    const applicationId = String(body.applicationId || "").trim();
    if (!applicationId) {
      const err = new Error("applicationId is required");
      err.status = 400;
      throw err;
    }

    const data = await addToWaitlist({ hallId, applicationId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function assignWaitlistEntry(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can assign from waiting list");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const entryId = String(req.params.entryId || "").trim();
    const body = req.body || {};
    const roomId = String(body.roomId || "").trim();
    if (!entryId || !roomId) {
      const err = new Error("entryId and roomId are required");
      err.status = 400;
      throw err;
    }

    const entry = await getWaitlistEntry(hallId, entryId);
    if (!entry || entry.status !== "ACTIVE") {
      const err = new Error("Waitlist entry not found");
      err.status = 404;
      throw err;
    }

    const data = await assignRoomToCandidate({
      hallId,
      applicationId: entry.applicationId,
      roomId,
      createdBy: req.user.userId || null,
    });

    await markWaitlistEntryAssigned({ hallId, entryId });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteWaitlistEntries(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can delete from waiting list");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const body = req.body || {};
    const entryIds = Array.isArray(body.entryIds) ? body.entryIds : [];
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const data = await removeWaitlistEntries({ hallId, entryIds, reason });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyHallWaitlist,
  addMyHallWaitlistEntry,
  assignWaitlistEntry,
  deleteWaitlistEntries,
};
