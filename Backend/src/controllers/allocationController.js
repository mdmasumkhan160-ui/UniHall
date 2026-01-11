const {
  listAllocationsByHallId,
  listAllocationCandidatesByHallId,
  updateAllocationRoom,
  vacateAllocation,
  assignRoomToCandidate,
  searchHallStudentsByStudentId,
  manualAllocateSeat,
} = require("../repositories/allocationRepository");

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "admin";
}

function parseStatusesQuery(req) {
  const raw =
    req?.query?.statuses ??
    req?.query?.status ??
    req?.query?.includeStatuses ??
    null;

  if (raw === null || raw === undefined || raw === "") return null;

  const tokens = Array.isArray(raw)
    ? raw.flatMap((v) => String(v || "").split(","))
    : String(raw || "").split(",");

  const cleaned = tokens
    .map((s) =>
      String(s || "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);

  if (!cleaned.length) return null;

  const allowed = new Set(["ALLOCATED", "ACTIVE", "VACATED", "EXPIRED"]);
  const invalid = cleaned.filter((s) => !allowed.has(s));
  if (invalid.length) {
    const err = new Error(
      `Invalid status value(s): ${invalid.join(", ")}. Allowed: ${Array.from(
        allowed
      ).join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  return Array.from(new Set(cleaned));
}

async function listMyHallAllocations(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view allocations");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const statuses = parseStatusesQuery(req);
    const data = await listAllocationsByHallId(hallId, statuses || undefined);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateMyHallAllocation(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can modify allocations");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const allocationId = req.params.allocationId;
    const body = req.body || {};
    const roomId = String(body.roomId || "").trim();
    if (!roomId) {
      const err = new Error("roomId is required");
      err.status = 400;
      throw err;
    }

    const data = await updateAllocationRoom({
      allocationId,
      hallId,
      newRoomId: roomId,
      updatedBy: req.user.userId || null,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteMyHallAllocation(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can delete allocations");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const allocationId = req.params.allocationId;
    const body = req.body || {};
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const data = await vacateAllocation({
      allocationId,
      hallId,
      reason: reason || null,
      updatedBy: req.user.userId || null,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listMyHallAllocationCandidates(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view allocation candidates");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const data = await listAllocationCandidatesByHallId(hallId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function assignSeatToCandidate(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can assign seats");
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
    const roomId = String(body.roomId || "").trim();
    if (!applicationId || !roomId) {
      const err = new Error("applicationId and roomId are required");
      err.status = 400;
      throw err;
    }

    const data = await assignRoomToCandidate({
      hallId,
      applicationId,
      roomId,
      createdBy: req.user.userId || null,
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function searchMyHallStudents(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can search students");
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
    if (!studentId) {
      return res.json({ success: true, data: [] });
    }

    const data = await searchHallStudentsByStudentId(hallId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function manualAssignSeat(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can assign seats");
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
    const studentId = String(body.studentId || "").trim();
    const roomId = String(body.roomId || "").trim();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!studentId || !roomId) {
      const err = new Error("studentId and roomId are required");
      err.status = 400;
      throw err;
    }
    if (!reason) {
      const err = new Error("reason is required for manual allocation");
      err.status = 400;
      throw err;
    }

    const data = await manualAllocateSeat({
      hallId,
      studentId,
      roomId,
      reason,
      createdBy: req.user.userId || null,
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyHallAllocations,
  updateMyHallAllocation,
  deleteMyHallAllocation,
  listMyHallAllocationCandidates,
  assignSeatToCandidate,
  searchMyHallStudents,
  manualAssignSeat,
};
