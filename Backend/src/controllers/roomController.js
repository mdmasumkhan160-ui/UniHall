const {
  listRoomsByHallId,
  createRoom,
  getRoomById,
  updateRoomById,
  deleteRoomById,
} = require("../repositories/roomRepository");

const ROOM_TYPES_ALL = new Set(["SINGLE", "DOUBLE", "TRIPLE", "QUAD"]);
const ROOM_TYPES_ALLOWED = new Set(["SINGLE", "DOUBLE"]);
const ROOM_STATUSES = new Set([
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "UNDER_REPAIR",
  "RESERVED",
]);

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "admin";
}

function toTrimmedString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toInt(value) {
  if (value === null || value === undefined || value === "") return NaN;
  return Number.parseInt(value, 10);
}

async function listMyHallRooms(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view rooms");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const data = await listRoomsByHallId(hallId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createMyHallRoom(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can create rooms");
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
    const roomNumber = toTrimmedString(body.roomNumber);
    const floorNumber = toInt(body.floorNumber);
    const capacity = toInt(body.capacity);
    const roomType = toTrimmedString(body.roomType).toUpperCase();
    const status = toTrimmedString(body.status || "AVAILABLE").toUpperCase();

    if (!roomNumber) {
      const err = new Error("roomNumber is required");
      err.status = 400;
      throw err;
    }
    if (roomNumber.length > 10) {
      const err = new Error("roomNumber must be at most 10 characters");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(floorNumber)) {
      const err = new Error("floorNumber must be a number");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      const err = new Error("capacity must be a positive number");
      err.status = 400;
      throw err;
    }
    if (!ROOM_TYPES_ALLOWED.has(roomType)) {
      const err = new Error("Invalid roomType");
      err.status = 400;
      throw err;
    }
    if (!ROOM_STATUSES.has(status)) {
      const err = new Error("Invalid status");
      err.status = 400;
      throw err;
    }

    try {
      const created = await createRoom({
        hallId,
        roomNumber,
        floorNumber,
        capacity,
        roomType,
        status,
      });

      res.status(201).json({ success: true, data: created });
    } catch (dbErr) {
      if (dbErr && dbErr.code === "ER_DUP_ENTRY") {
        const err = new Error("Room number already exists for this hall");
        err.status = 409;
        throw err;
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
}

async function updateMyHallRoom(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can update rooms");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const roomId = toTrimmedString(req.params.roomId);
    if (!roomId) {
      const err = new Error("roomId is required");
      err.status = 400;
      throw err;
    }

    const existing = await getRoomById(roomId, hallId);
    if (!existing) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }

    const body = req.body || {};

    const nextRoomNumber =
      body.roomNumber !== undefined
        ? toTrimmedString(body.roomNumber)
        : existing.roomNumber;
    const nextFloorNumber =
      body.floorNumber !== undefined
        ? toInt(body.floorNumber)
        : Number(existing.floorNumber);
    const nextCapacity =
      body.capacity !== undefined
        ? toInt(body.capacity)
        : Number(existing.capacity);
    const nextCurrentOccupancy =
      body.currentOccupancy !== undefined
        ? toInt(body.currentOccupancy)
        : Number(existing.currentOccupancy);
    const nextRoomType =
      body.roomType !== undefined
        ? toTrimmedString(body.roomType).toUpperCase()
        : String(existing.roomType).toUpperCase();
    const nextStatus =
      body.status !== undefined
        ? toTrimmedString(body.status).toUpperCase()
        : String(existing.status).toUpperCase();

    if (!nextRoomNumber) {
      const err = new Error("roomNumber is required");
      err.status = 400;
      throw err;
    }
    if (nextRoomNumber.length > 10) {
      const err = new Error("roomNumber must be at most 10 characters");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(nextFloorNumber)) {
      const err = new Error("floorNumber must be a number");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(nextCapacity) || nextCapacity <= 0) {
      const err = new Error("capacity must be a positive number");
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(nextCurrentOccupancy) || nextCurrentOccupancy < 0) {
      const err = new Error("currentOccupancy must be a non-negative number");
      err.status = 400;
      throw err;
    }
    if (nextCurrentOccupancy > nextCapacity) {
      const err = new Error("currentOccupancy cannot exceed capacity");
      err.status = 400;
      throw err;
    }
    if (body.roomType !== undefined) {
      if (!ROOM_TYPES_ALLOWED.has(nextRoomType)) {
        const err = new Error("Invalid roomType");
        err.status = 400;
        throw err;
      }
    } else if (!ROOM_TYPES_ALL.has(nextRoomType)) {
      const err = new Error("Invalid roomType");
      err.status = 400;
      throw err;
    }
    if (!ROOM_STATUSES.has(nextStatus)) {
      const err = new Error("Invalid status");
      err.status = 400;
      throw err;
    }

    try {
      const updated = await updateRoomById({
        roomId,
        hallId,
        roomNumber: nextRoomNumber,
        floorNumber: nextFloorNumber,
        capacity: nextCapacity,
        currentOccupancy: nextCurrentOccupancy,
        roomType: nextRoomType,
        status: nextStatus,
      });

      if (!updated) {
        const err = new Error("Room not found");
        err.status = 404;
        throw err;
      }

      res.json({ success: true, data: updated });
    } catch (dbErr) {
      if (dbErr && dbErr.code === "ER_DUP_ENTRY") {
        const err = new Error("Room number already exists for this hall");
        err.status = 409;
        throw err;
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
}

async function deleteMyHallRoom(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can delete rooms");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const roomId = toTrimmedString(req.params.roomId);
    if (!roomId) {
      const err = new Error("roomId is required");
      err.status = 400;
      throw err;
    }

    try {
      const deleted = await deleteRoomById(roomId, hallId);
      if (!deleted) {
        const err = new Error("Room not found");
        err.status = 404;
        throw err;
      }

      res.json({ success: true });
    } catch (dbErr) {
      if (dbErr && dbErr.code === "ER_ROW_IS_REFERENCED_2") {
        const err = new Error(
          "Cannot delete room because it is referenced by allocations"
        );
        err.status = 409;
        throw err;
      }
      throw dbErr;
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyHallRooms,
  createMyHallRoom,
  updateMyHallRoom,
  deleteMyHallRoom,
};
