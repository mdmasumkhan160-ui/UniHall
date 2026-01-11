const { initPool } = require("../../config/db");

async function expireAllocationSystem({ allocationId, reason = null }) {
  if (!allocationId) {
    const err = new Error("allocationId is required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[alloc]] = await connection.query(
      `SELECT sa.allocationId, sa.roomId, sa.status, r.hallId
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE sa.allocationId = ?
        FOR UPDATE`,
      [allocationId]
    );

    if (!alloc) {
      const err = new Error("Allocation not found");
      err.status = 404;
      throw err;
    }

    const currentStatus = String(alloc.status || "").toUpperCase();
    if (currentStatus !== "ALLOCATED" && currentStatus !== "ACTIVE") {
      await connection.rollback();
      return { allocationId, status: currentStatus };
    }

    await connection.query(
      `UPDATE student_allocations
          SET status = 'EXPIRED',
              endDate = NOW(),
              remarks = COALESCE(remarks, ''),
              reason = ?,
              updated_at = NOW()
        WHERE allocationId = ?`,
      [reason, allocationId]
    );

    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = GREATEST(0, currentOccupancy - 1)
        WHERE roomId = ? AND hallId = ?`,
      [alloc.roomId, alloc.hallId]
    );

    await connection.query(
      `UPDATE rooms
          SET status = CASE
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy >= capacity THEN 'OCCUPIED'
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy < capacity THEN 'AVAILABLE'
              ELSE status
            END
        WHERE roomId = ? AND hallId = ?`,
      [alloc.roomId, alloc.hallId]
    );

    await connection.commit();
    return { allocationId, status: "EXPIRED" };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function extendAllocationEndDateSystem({ allocationId, newEndDate }) {
  if (!allocationId || !newEndDate) return;
  const pool = await initPool();
  await pool.query(
    `UPDATE student_allocations
        SET endDate = ?, updated_at = NOW()
      WHERE allocationId = ? AND status IN ('ALLOCATED','ACTIVE')`,
    [newEndDate, allocationId]
  );
}

module.exports = { expireAllocationSystem, extendAllocationEndDateSystem };
