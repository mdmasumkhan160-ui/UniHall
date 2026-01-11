const { initPool } = require("../../config/db");
const { v4: uuid } = require("uuid");
const { createNotification } = require("./notificationRepository");
const { computeEffectiveExpiryDate } = require("../utils/allocationExpiry");

function formatDateOnly(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function isTruthyString(value) {
  return (
    value !== null && value !== undefined && String(value).trim().length > 0
  );
}

async function searchHallStudentsByStudentId(
  hallId,
  studentIdQuery,
  limit = 10
) {
  const q = String(studentIdQuery || "").trim();
  if (!hallId || !q) return [];

  const pool = await initPool();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 25));
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `SELECT sp.userId,
            sp.universityId,
            sp.department,
            sp.sessionYear,
            u.name,
            u.email
       FROM student_profiles sp
       LEFT JOIN users u ON u.userId = sp.userId
      WHERE sp.hallId = ?
        AND (sp.universityId LIKE ? OR sp.userId LIKE ?)
      ORDER BY sp.universityId ASC
      LIMIT ${safeLimit}`,
    [hallId, like, like]
  );

  return rows.map((r) => ({
    userId: r.userId,
    studentId: r.universityId || r.userId,
    name: r.name || "Unknown",
    email: r.email || "N/A",
    department: r.department || null,
    session: r.sessionYear || null,
  }));
}

async function listAllocationCandidatesByHallId(hallId) {
  const pool = await initPool();

  const [rows] = await pool.query(
    `SELECT a.applicationId,
            a.studentId,
            a.formId,
            a.status AS applicationStatus,
            a.submissionDate,
            a.totalScore AS applicationScore,

            i.interviewId,
            i.interviewScore,
            i.date AS interviewDate,
            i.time AS interviewTime,
            i.venue AS interviewVenue,

            u.name AS studentName,
            u.email AS studentEmail,
            sp.universityId AS studentUniversityId,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear,
              sp.programLevel AS studentProgramLevel,

            f.formTitle
       FROM applications a
       JOIN interviews i ON i.applicationId = a.applicationId
       LEFT JOIN application_forms f ON f.formId = a.formId
       LEFT JOIN users u ON u.userId = a.studentId
       LEFT JOIN student_profiles sp ON sp.userId = a.studentId
       LEFT JOIN student_allocations sa
              ON sa.applicationId = a.applicationId
             AND sa.status IN ('ALLOCATED','ACTIVE')
             AND sa.roomId IS NOT NULL
       LEFT JOIN waitlist_entries wl
              ON wl.applicationId = a.applicationId
             AND wl.hallId = a.hallId
             AND wl.status = 'ACTIVE'
      WHERE a.hallId = ?
        AND i.interviewScore IS NOT NULL
          AND i.status = 1
        AND sa.allocationId IS NULL
        AND wl.entryId IS NULL
        AND a.status NOT IN ('alloted','rejected')
      ORDER BY a.totalScore DESC, i.interviewScore DESC, a.submissionDate ASC`,
    [hallId]
  );

  return rows.map((r) => ({
    applicationId: r.applicationId,
    formId: r.formId,
    status: r.applicationStatus,
    submittedAt: r.submissionDate,
    applicationScore: Number(r.applicationScore || 0),
    interview: {
      interviewId: r.interviewId,
      interviewScore:
        r.interviewScore === null || r.interviewScore === undefined
          ? null
          : Number(r.interviewScore),
      date: r.interviewDate,
      time: r.interviewTime,
      venue: r.interviewVenue,
    },
    student: {
      userId: r.studentId,
      name: r.studentName || "Unknown",
      email: r.studentEmail || "N/A",
      studentId: r.studentUniversityId || r.studentId,
      programLevel: r.studentProgramLevel || null,
      department: r.studentDepartment || null,
      session: r.studentSessionYear || null,
    },
    formTitle: r.formTitle || null,
  }));
}

async function assignRoomToCandidate({
  hallId,
  applicationId,
  roomId,
  createdBy,
}) {
  if (
    !isTruthyString(hallId) ||
    !isTruthyString(applicationId) ||
    !isTruthyString(roomId)
  ) {
    const err = new Error("hallId, applicationId and roomId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  let notifyStudentId = null;
  let notifyRoomNumber = null;
  let notifyExpiry = null;
  try {
    await connection.beginTransaction();

    const [[app]] = await connection.query(
      `SELECT applicationId, studentId, hallId, status
         FROM applications
        WHERE applicationId = ? AND hallId = ?
        FOR UPDATE`,
      [applicationId, hallId]
    );

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const [[interview]] = await connection.query(
      `SELECT interviewId, interviewScore, status
         FROM interviews
        WHERE applicationId = ?
        FOR UPDATE`,
      [applicationId]
    );

    if (
      !interview ||
      interview.interviewScore === null ||
      interview.interviewScore === undefined
    ) {
      const err = new Error(
        "Interview score is required before seat allocation"
      );
      err.status = 400;
      throw err;
    }

    if (Number(interview.status) !== 1) {
      const err = new Error(
        "Interview must be confirmed before seat allocation"
      );
      err.status = 400;
      throw err;
    }

    const [[existing]] = await connection.query(
      `SELECT allocationId
         FROM student_allocations
        WHERE applicationId = ?
          AND status IN ('ALLOCATED','ACTIVE')
          AND roomId IS NOT NULL
        LIMIT 1
        FOR UPDATE`,
      [applicationId]
    );

    if (existing) {
      const err = new Error("Seat already allocated for this application");
      err.status = 409;
      throw err;
    }

    const [[room]] = await connection.query(
      `SELECT roomId, hallId, roomNumber, capacity, currentOccupancy, status
         FROM rooms
        WHERE roomId = ? AND hallId = ?
        FOR UPDATE`,
      [roomId, hallId]
    );

    if (!room) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }

    const capacity = Number(room.capacity || 0);
    const occ = Number(room.currentOccupancy || 0);
    if (capacity <= 0) {
      const err = new Error("Room capacity is invalid");
      err.status = 400;
      throw err;
    }
    if (occ >= capacity) {
      const err = new Error("Room is full");
      err.status = 400;
      throw err;
    }

    const roomStatus = String(room.status || "").toUpperCase();
    if (roomStatus !== "AVAILABLE" && roomStatus !== "OCCUPIED") {
      const err = new Error("Room is not available for allocation");
      err.status = 400;
      throw err;
    }

    const allocationId = uuid();
    const now = new Date();

    const [[profile]] = await connection.query(
      `SELECT sessionYear
         FROM student_profiles
        WHERE userId = ?
        LIMIT 1`,
      [app.studentId]
    );
    notifyStudentId = app.studentId;
    notifyRoomNumber = room.roomNumber || null;
    notifyExpiry = computeEffectiveExpiryDate({
      sessionYear: profile?.sessionYear || null,
      startDate: now,
      endDate: null,
    });

    if (!notifyExpiry || Number.isNaN(new Date(notifyExpiry).getTime())) {
      const err = new Error("Failed to compute seat expiry date");
      err.status = 400;
      throw err;
    }

    await connection.query(
      `INSERT INTO student_allocations (
        allocationId,
        studentId,
        roomId,
        applicationId,
        startDate,
        endDate,
        status,
        allocationDate,
        created_at,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'ALLOCATED', ?, ?, ?)`,
      [
        allocationId,
        app.studentId,
        roomId,
        applicationId,
        now,
        notifyExpiry,
        now,
        now,
        createdBy || null,
      ]
    );

    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = currentOccupancy + 1
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.query(
      `UPDATE rooms
          SET status = CASE
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy >= capacity THEN 'OCCUPIED'
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy < capacity THEN 'AVAILABLE'
              ELSE status
            END
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.query(
      `UPDATE applications
          SET status = 'alloted', updated_at = NOW()
        WHERE applicationId = ? AND hallId = ?`,
      [applicationId, hallId]
    );

    await connection.commit();

    // Notify after commit
    if (notifyStudentId) {
      const expiryText = formatDateOnly(notifyExpiry);
      const roomText = notifyRoomNumber
        ? `Room ${notifyRoomNumber}`
        : "your room";
      const extra = expiryText ? ` Seat expiry: ${expiryText}.` : "";
      await createNotification({
        userId: notifyStudentId,
        hallId,
        title: "Seat Allocated",
        body: `Your seat has been allocated. ${roomText}.${extra}`,
      });
    }

    return { allocationId, applicationId, roomId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function manualAllocateSeat({
  hallId,
  studentId,
  roomId,
  reason,
  createdBy,
}) {
  if (
    !isTruthyString(hallId) ||
    !isTruthyString(studentId) ||
    !isTruthyString(roomId)
  ) {
    const err = new Error("hallId, studentId and roomId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Resolve student (studentId refers to student_profiles.universityId or userId)
    const [[student]] = await connection.query(
      `SELECT sp.userId, sp.universityId, sp.sessionYear
         FROM student_profiles sp
        WHERE sp.hallId = ?
          AND (sp.universityId = ? OR sp.userId = ?)
        LIMIT 1
        FOR UPDATE`,
      [hallId, studentId, studentId]
    );

    if (!student) {
      const err = new Error("Student not found in this hall");
      err.status = 404;
      throw err;
    }

    const studentUserId = student.userId;

    // Student must not already have an active allocation in this hall
    const [[existingAlloc]] = await connection.query(
      `SELECT sa.allocationId
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE sa.studentId = ?
          AND r.hallId = ?
          AND sa.status IN ('ALLOCATED','ACTIVE')
        LIMIT 1
        FOR UPDATE`,
      [studentUserId, hallId]
    );

    if (existingAlloc) {
      const err = new Error("Student already has an active allocation");
      err.status = 409;
      throw err;
    }

    // Get active form + latest version for this hall (required by FK constraints on applications)
    const [[activeForm]] = await connection.query(
      `SELECT formId
         FROM application_forms
        WHERE hallId = ? AND isActive = 1
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1`,
      [hallId]
    );

    if (!activeForm) {
      const err = new Error(
        "No active form found for this hall. Set a form as Active first."
      );
      err.status = 400;
      throw err;
    }

    const [[version]] = await connection.query(
      `SELECT versionId
         FROM form_versions
        WHERE formId = ? AND status <> 'DELETED'
        ORDER BY versionNumber DESC
        LIMIT 1`,
      [activeForm.formId]
    );

    if (!version) {
      const err = new Error("Active form has no version");
      err.status = 400;
      throw err;
    }

    // Lock room and validate capacity
    const [[room]] = await connection.query(
      `SELECT roomId, hallId, roomNumber, capacity, currentOccupancy, status
         FROM rooms
        WHERE roomId = ? AND hallId = ?
        FOR UPDATE`,
      [roomId, hallId]
    );

    if (!room) {
      const err = new Error("Room not found");
      err.status = 404;
      throw err;
    }

    const capacity = Number(room.capacity || 0);
    const occ = Number(room.currentOccupancy || 0);
    if (capacity <= 0) {
      const err = new Error("Room capacity is invalid");
      err.status = 400;
      throw err;
    }
    if (occ >= capacity) {
      const err = new Error("Room is full");
      err.status = 400;
      throw err;
    }

    const roomStatus = String(room.status || "").toUpperCase();
    if (roomStatus !== "AVAILABLE" && roomStatus !== "OCCUPIED") {
      const err = new Error("Room is not available for allocation");
      err.status = 400;
      throw err;
    }

    const cleanReason = typeof reason === "string" ? reason.trim() : "";
    if (!cleanReason) {
      const err = new Error("reason is required for manual allocation");
      err.status = 400;
      throw err;
    }

    let applicationId = uuid();
    const allocationId = uuid();
    const now = new Date();

    // Reuse an existing application for this active form if it exists to avoid unique constraint (formId, studentId)
    const [[existingApp]] = await connection.query(
      `SELECT applicationId
         FROM applications
        WHERE hallId = ? AND formId = ? AND studentId = ?
        LIMIT 1
        FOR UPDATE`,
      [hallId, activeForm.formId, studentUserId]
    );

    if (existingApp?.applicationId) {
      applicationId = existingApp.applicationId;
      await connection.query(
        `UPDATE applications SET status = 'alloted', updated_at = NOW() WHERE applicationId = ?`,
        [applicationId]
      );
    } else {
      // Create a minimal application record to satisfy FK requirements
      await connection.query(
        `INSERT INTO applications (
          applicationId,
          studentId,
          hallId,
          formId,
          formVersionId,
          status,
          submissionDate,
          totalScore,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 'alloted', ?, 0.00, ?, ?)`,
        [
          applicationId,
          studentUserId,
          hallId,
          activeForm.formId,
          version.versionId,
          now,
          now,
          now,
        ]
      );
    }

    const expiry = computeEffectiveExpiryDate({
      sessionYear: student.sessionYear || null,
      startDate: now,
      endDate: null,
    });

    if (!expiry || Number.isNaN(new Date(expiry).getTime())) {
      const err = new Error("Failed to compute seat expiry date");
      err.status = 400;
      throw err;
    }

    await connection.query(
      `INSERT INTO student_allocations (
        allocationId,
        studentId,
        roomId,
        applicationId,
        startDate,
        endDate,
        status,
        allocationDate,
        reason,
        created_at,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'ALLOCATED', ?, ?, ?, ?)`,
      [
        allocationId,
        studentUserId,
        roomId,
        applicationId,
        now,
        expiry,
        now,
        cleanReason,
        now,
        createdBy || null,
      ]
    );

    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = currentOccupancy + 1
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.query(
      `UPDATE rooms
          SET status = CASE
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy >= capacity THEN 'OCCUPIED'
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy < capacity THEN 'AVAILABLE'
              ELSE status
            END
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.commit();

    // Notify after commit
    const expiryText = formatDateOnly(expiry);
    const roomText = room.roomNumber ? `Room ${room.roomNumber}` : "your room";
    const extra = expiryText ? ` Seat expiry: ${expiryText}.` : "";
    await createNotification({
      userId: studentUserId,
      hallId,
      title: "Seat Allocated",
      body: `Your seat has been allocated. ${roomText}.${extra}`,
    });

    return {
      allocationId,
      applicationId,
      roomId,
      studentId: student.studentId || studentUserId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function listAllocationsByHallId(
  hallId,
  statuses = ["ALLOCATED", "ACTIVE"]
) {
  const pool = await initPool();
  const wanted =
    Array.isArray(statuses) && statuses.length
      ? statuses
      : ["ALLOCATED", "ACTIVE"];

  const [rows] = await pool.query(
    `SELECT sa.allocationId,
            sa.studentId,
            sa.roomId,
            sa.applicationId,
            sa.startDate,
            sa.endDate,
            sa.status,
            sa.allocationDate,
            sa.vacatedDate,
            sa.vacationReason,
            sa.remarks,
            sa.reason,
            sa.created_at,
            sa.updated_at,

            u.name AS studentName,
            u.email AS studentEmail,
            sp.universityId AS studentUniversityId,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear,

            r.roomNumber,
            r.floorNumber,
            r.capacity,
            r.currentOccupancy,
            r.status AS roomStatus
       FROM student_allocations sa
       JOIN rooms r ON r.roomId = sa.roomId
       LEFT JOIN users u ON u.userId = sa.studentId
       LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
      WHERE r.hallId = ?
        AND sa.status IN (?)
      ORDER BY sa.created_at DESC`,
    [hallId, wanted]
  );

  return rows.map((r) => ({
    allocationId: r.allocationId,
    student: {
      userId: r.studentId,
      name: r.studentName || "Unknown",
      email: r.studentEmail || "N/A",
      studentId: r.studentUniversityId || r.studentId,
      department: r.studentDepartment || null,
      session: r.studentSessionYear || null,
    },
    room: {
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      floorNumber: r.floorNumber,
      capacity: r.capacity,
      currentOccupancy: r.currentOccupancy,
      status: r.roomStatus,
    },
    applicationId: r.applicationId,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
    allocationDate: r.allocationDate,
    vacatedDate: r.vacatedDate,
    vacationReason: r.vacationReason,
    remarks: r.remarks,
    reason: r.reason || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

async function updateAllocationRoom({
  allocationId,
  hallId,
  newRoomId,
  updatedBy,
}) {
  if (
    !isTruthyString(allocationId) ||
    !isTruthyString(hallId) ||
    !isTruthyString(newRoomId)
  ) {
    const err = new Error("allocationId, hallId and roomId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[alloc]] = await connection.query(
      `SELECT sa.allocationId, sa.studentId, sa.roomId AS oldRoomId, sa.status
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE sa.allocationId = ? AND r.hallId = ?
        FOR UPDATE`,
      [allocationId, hallId]
    );

    if (!alloc) {
      const err = new Error("Allocation not found");
      err.status = 404;
      throw err;
    }

    if (
      String(alloc.status).toUpperCase() !== "ALLOCATED" &&
      String(alloc.status).toUpperCase() !== "ACTIVE"
    ) {
      const err = new Error(
        "Only ACTIVE/ALLOCATED allocations can be modified"
      );
      err.status = 400;
      throw err;
    }

    const oldRoomId = alloc.oldRoomId;
    if (String(oldRoomId) === String(newRoomId)) {
      await connection.commit();
      return { allocationId, roomId: newRoomId };
    }

    const [[oldRoom]] = await connection.query(
      `SELECT roomId, hallId, capacity, currentOccupancy, status
         FROM rooms
        WHERE roomId = ? AND hallId = ?
        FOR UPDATE`,
      [oldRoomId, hallId]
    );

    const [[newRoom]] = await connection.query(
      `SELECT roomId, hallId, capacity, currentOccupancy, status
         FROM rooms
        WHERE roomId = ? AND hallId = ?
        FOR UPDATE`,
      [newRoomId, hallId]
    );

    if (!newRoom) {
      const err = new Error("Target room not found");
      err.status = 404;
      throw err;
    }

    const newRoomStatus = String(newRoom.status || "").toUpperCase();
    if (newRoomStatus !== "AVAILABLE" && newRoomStatus !== "OCCUPIED") {
      const err = new Error("Target room is not available for allocation");
      err.status = 400;
      throw err;
    }

    const newOcc = Number(newRoom.currentOccupancy || 0);
    const newCap = Number(newRoom.capacity || 0);
    if (newCap <= 0) {
      const err = new Error("Target room capacity is invalid");
      err.status = 400;
      throw err;
    }
    if (newOcc >= newCap) {
      const err = new Error("Target room is full");
      err.status = 400;
      throw err;
    }

    // Move allocation
    await connection.query(
      `UPDATE student_allocations
          SET roomId = ?, updated_at = NOW(), updated_by = ?
        WHERE allocationId = ?`,
      [newRoomId, updatedBy || null, allocationId]
    );

    // Decrement old room occupancy
    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = GREATEST(0, currentOccupancy - 1)
        WHERE roomId = ? AND hallId = ?`,
      [oldRoomId, hallId]
    );

    // Increment new room occupancy
    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = currentOccupancy + 1
        WHERE roomId = ? AND hallId = ?`,
      [newRoomId, hallId]
    );

    // Refresh statuses based on occupancy (only for rooms that are AVAILABLE/OCCUPIED)
    await connection.query(
      `UPDATE rooms
          SET status = CASE
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy >= capacity THEN 'OCCUPIED'
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy < capacity THEN 'AVAILABLE'
              ELSE status
            END
        WHERE roomId IN (?, ?) AND hallId = ?`,
      [oldRoomId, newRoomId, hallId]
    );

    await connection.commit();
    return { allocationId, roomId: newRoomId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function vacateAllocation({ allocationId, hallId, reason, updatedBy }) {
  if (!isTruthyString(allocationId) || !isTruthyString(hallId)) {
    const err = new Error("allocationId and hallId are required");
    err.status = 400;
    throw err;
  }

  const pool = await initPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[alloc]] = await connection.query(
      `SELECT sa.allocationId, sa.roomId, sa.status
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE sa.allocationId = ? AND r.hallId = ?
        FOR UPDATE`,
      [allocationId, hallId]
    );

    if (!alloc) {
      const err = new Error("Allocation not found");
      err.status = 404;
      throw err;
    }

    const currentStatus = String(alloc.status || "").toUpperCase();
    if (currentStatus !== "ALLOCATED" && currentStatus !== "ACTIVE") {
      const err = new Error("Only ACTIVE/ALLOCATED allocations can be deleted");
      err.status = 400;
      throw err;
    }

    const roomId = alloc.roomId;

    await connection.query(
      `UPDATE student_allocations
          SET status = 'VACATED',
              vacatedDate = NOW(),
              vacationReason = ?,
              updated_at = NOW(),
              updated_by = ?
        WHERE allocationId = ?`,
      [reason || null, updatedBy || null, allocationId]
    );

    await connection.query(
      `UPDATE rooms
          SET currentOccupancy = GREATEST(0, currentOccupancy - 1)
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.query(
      `UPDATE rooms
          SET status = CASE
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy >= capacity THEN 'OCCUPIED'
              WHEN status IN ('AVAILABLE','OCCUPIED') AND currentOccupancy < capacity THEN 'AVAILABLE'
              ELSE status
            END
        WHERE roomId = ? AND hallId = ?`,
      [roomId, hallId]
    );

    await connection.commit();
    return { allocationId, status: "VACATED" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  listAllocationsByHallId,
  listAllocationCandidatesByHallId,
  updateAllocationRoom,
  vacateAllocation,
  assignRoomToCandidate,
  searchHallStudentsByStudentId,
  manualAllocateSeat,
};
