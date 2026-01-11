const { v4: uuid } = require("uuid");
const { initPool } = require("../../config/db");

async function listRoomsByHallId(hallId) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT roomId,
            hallId,
            roomNumber,
            floorNumber,
            capacity,
            currentOccupancy,
            roomType,
            status,
            created_at,
            updated_at
       FROM rooms
      WHERE hallId = ?
      ORDER BY floorNumber ASC, roomNumber ASC`,
    [hallId]
  );
  return rows;
}

async function createRoom({
  hallId,
  roomNumber,
  floorNumber,
  capacity,
  roomType,
  status,
}) {
  const pool = await initPool();
  const roomId = uuid();

  await pool.query(
    `INSERT INTO rooms (
        roomId,
        hallId,
        roomNumber,
        floorNumber,
        capacity,
        currentOccupancy,
        roomType,
        status
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [roomId, hallId, roomNumber, floorNumber, capacity, roomType, status]
  );

  const [rows] = await pool.query(
    `SELECT roomId,
            hallId,
            roomNumber,
            floorNumber,
            capacity,
            currentOccupancy,
            roomType,
            status,
            created_at,
            updated_at
       FROM rooms
      WHERE roomId = ?`,
    [roomId]
  );

  return rows[0] || null;
}

async function getRoomById(roomId, hallId) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT roomId,
            hallId,
            roomNumber,
            floorNumber,
            capacity,
            currentOccupancy,
            roomType,
            status,
            created_at,
            updated_at
       FROM rooms
      WHERE roomId = ? AND hallId = ?`,
    [roomId, hallId]
  );
  return rows[0] || null;
}

async function updateRoomById({
  roomId,
  hallId,
  roomNumber,
  floorNumber,
  capacity,
  currentOccupancy,
  roomType,
  status,
}) {
  const pool = await initPool();
  const [result] = await pool.query(
    `UPDATE rooms
        SET roomNumber = ?,
            floorNumber = ?,
            capacity = ?,
            currentOccupancy = ?,
            roomType = ?,
            status = ?
      WHERE roomId = ? AND hallId = ?`,
    [
      roomNumber,
      floorNumber,
      capacity,
      currentOccupancy,
      roomType,
      status,
      roomId,
      hallId,
    ]
  );

  if (!result || result.affectedRows === 0) return null;
  return getRoomById(roomId, hallId);
}

async function deleteRoomById(roomId, hallId) {
  const pool = await initPool();
  const [result] = await pool.query(
    `DELETE FROM rooms WHERE roomId = ? AND hallId = ?`,
    [roomId, hallId]
  );
  return Boolean(result && result.affectedRows > 0);
}

module.exports = {
  listRoomsByHallId,
  createRoom,
  getRoomById,
  updateRoomById,
  deleteRoomById,
};
