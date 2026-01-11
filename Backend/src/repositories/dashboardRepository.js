const { initPool } = require("../../config/db");

function getLastSevenSessionStartYearWindow() {
  const currentYear = new Date().getFullYear();
  return {
    minStartYear: currentYear - 6,
    maxStartYear: currentYear,
  };
}

async function getRegisteredStudentCountByHallId(hallId) {
  if (!hallId) return 0;
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM student_profiles
      WHERE hallId = ?`,
    [hallId]
  );
  return Number(rows?.[0]?.total || 0);
}

async function getAllocatedStudentCountByHallId(
  hallId,
  statuses = ["ALLOCATED", "ACTIVE"]
) {
  if (!hallId) return 0;
  const pool = await initPool();
  const wanted =
    Array.isArray(statuses) && statuses.length
      ? statuses
      : ["ALLOCATED", "ACTIVE"];
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT sa.studentId) AS total
       FROM student_allocations sa
       JOIN rooms r ON r.roomId = sa.roomId
      WHERE r.hallId = ?
        AND sa.status IN (?)
        AND sa.vacatedDate IS NULL
        AND sa.startDate <= NOW()
        AND (sa.endDate IS NULL OR sa.endDate >= NOW())`,
    [hallId, wanted]
  );
  return Number(rows?.[0]?.total || 0);
}

async function getAllocatedStudentsBySessionForHall(
  hallId,
  statuses = ["ALLOCATED", "ACTIVE"]
) {
  if (!hallId) return [];
  const pool = await initPool();
  const wanted =
    Array.isArray(statuses) && statuses.length
      ? statuses
      : ["ALLOCATED", "ACTIVE"];

  const { minStartYear, maxStartYear } = getLastSevenSessionStartYearWindow();

  const [rows] = await pool.query(
    `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
            COUNT(DISTINCT sa.studentId) AS total
       FROM student_allocations sa
       JOIN rooms r ON r.roomId = sa.roomId
       LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
      WHERE r.hallId = ?
        AND sa.status IN (?)
        AND sa.vacatedDate IS NULL
        AND sa.startDate <= NOW()
        AND (sa.endDate IS NULL OR sa.endDate >= NOW())
        AND sp.sessionYear IS NOT NULL
        AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
        AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
      GROUP BY startYear
      ORDER BY startYear ASC`,
    [hallId, wanted, minStartYear, maxStartYear]
  );

  const countByStartYear = new Map(
    (rows || []).map((r) => [Number(r.startYear), Number(r.total || 0)])
  );

  const out = [];
  for (let y = minStartYear; y <= maxStartYear; y += 1) {
    out.push({
      sessionYear: `${y}-${y + 1}`,
      count: Number(countByStartYear.get(y) || 0),
    });
  }
  return out;
}

async function getSessionFunnelBySessionForHall(
  hallId,
  allocationStatuses = ["ALLOCATED", "ACTIVE"]
) {
  if (!hallId) return [];
  const pool = await initPool();
  const wantedAllocations =
    Array.isArray(allocationStatuses) && allocationStatuses.length
      ? allocationStatuses
      : ["ALLOCATED", "ACTIVE"];

  const { minStartYear, maxStartYear } = getLastSevenSessionStartYearWindow();

  const [applicationsRows, allocationsRows, waitlistRows] = await Promise.all([
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT a.studentId) AS total
         FROM applications a
         LEFT JOIN student_profiles sp ON sp.userId = a.studentId
        WHERE a.hallId = ?
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, minStartYear, maxStartYear]
    ),
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT sa.studentId) AS total
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE r.hallId = ?
          AND sa.status IN (?)
          AND sa.vacatedDate IS NULL
          AND sa.startDate <= NOW()
          AND (sa.endDate IS NULL OR sa.endDate >= NOW())
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, wantedAllocations, minStartYear, maxStartYear]
    ),
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT wl.studentId) AS total
         FROM waitlist_entries wl
         LEFT JOIN student_profiles sp ON sp.userId = wl.studentId
        WHERE wl.hallId = ?
          AND wl.status = 'ACTIVE'
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, minStartYear, maxStartYear]
    ),
  ]);

  const appsMap = new Map(
    (applicationsRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );
  const allocMap = new Map(
    (allocationsRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );
  const waitMap = new Map(
    (waitlistRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );

  const out = [];
  for (let y = minStartYear; y <= maxStartYear; y += 1) {
    out.push({
      sessionYear: `${y}-${y + 1}`,
      applications: Number(appsMap.get(y) || 0),
      allocated: Number(allocMap.get(y) || 0),
      waiting: Number(waitMap.get(y) || 0),
    });
  }
  return out;
}

async function getSessionFunnelBySessionForHallAndFormId(
  hallId,
  formId,
  allocationStatuses = ["ALLOCATED", "ACTIVE"]
) {
  if (!hallId || !formId) return [];
  const pool = await initPool();
  const wantedAllocations =
    Array.isArray(allocationStatuses) && allocationStatuses.length
      ? allocationStatuses
      : ["ALLOCATED", "ACTIVE"];

  const { minStartYear, maxStartYear } = getLastSevenSessionStartYearWindow();

  const [applicationsRows, allocationsRows, waitlistRows] = await Promise.all([
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT a.studentId) AS total
         FROM applications a
         LEFT JOIN student_profiles sp ON sp.userId = a.studentId
        WHERE a.hallId = ?
          AND a.formId = ?
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, formId, minStartYear, maxStartYear]
    ),
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT sa.studentId) AS total
         FROM student_allocations sa
         JOIN applications a ON a.applicationId = sa.applicationId
         JOIN rooms r ON r.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE a.hallId = ?
          AND a.formId = ?
          AND r.hallId = ?
          AND sa.status IN (?)
          AND sa.vacatedDate IS NULL
          AND sa.startDate <= NOW()
          AND (sa.endDate IS NULL OR sa.endDate >= NOW())
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, formId, hallId, wantedAllocations, minStartYear, maxStartYear]
    ),
    pool.query(
      `SELECT CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) AS startYear,
              COUNT(DISTINCT wl.studentId) AS total
         FROM waitlist_entries wl
         JOIN applications a ON a.applicationId = wl.applicationId
         LEFT JOIN student_profiles sp ON sp.userId = wl.studentId
        WHERE wl.hallId = ?
          AND a.hallId = ?
          AND a.formId = ?
          AND wl.status = 'ACTIVE'
          AND sp.sessionYear IS NOT NULL
          AND sp.sessionYear REGEXP '^[0-9]{4}-[0-9]{4}$'
          AND CAST(SUBSTRING(sp.sessionYear, 1, 4) AS UNSIGNED) BETWEEN ? AND ?
        GROUP BY startYear
        ORDER BY startYear ASC`,
      [hallId, hallId, formId, minStartYear, maxStartYear]
    ),
  ]);

  const appsMap = new Map(
    (applicationsRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );
  const allocMap = new Map(
    (allocationsRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );
  const waitMap = new Map(
    (waitlistRows?.[0] || []).map((r) => [
      Number(r.startYear),
      Number(r.total || 0),
    ])
  );

  const out = [];
  for (let y = minStartYear; y <= maxStartYear; y += 1) {
    out.push({
      sessionYear: `${y}-${y + 1}`,
      applications: Number(appsMap.get(y) || 0),
      allocated: Number(allocMap.get(y) || 0),
      waiting: Number(waitMap.get(y) || 0),
    });
  }
  return out;
}

function normalizeNullableString(value) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

async function listCurrentResidentsForHall({
  hallId,
  department = null,
  sessionYear = null,
  formId = null,
}) {
  if (!hallId) return [];
  const pool = await initPool();

  const dept = normalizeNullableString(department);
  const sess = normalizeNullableString(sessionYear);
  const fId = normalizeNullableString(formId);

  // Only CURRENT residents: active allocation, not vacated, and within date range.
  const [rows] = await pool.query(
    `SELECT DISTINCT
            sp.universityId AS studentUniversityId,
            u.name AS studentName,
            sp.department AS studentDepartment,
            sp.sessionYear AS studentSessionYear,
            a.totalScore AS totalScore,
            r.roomNumber AS roomNumber,
            r.floorNumber AS floorNumber
       FROM student_allocations sa
       JOIN rooms r ON r.roomId = sa.roomId
       LEFT JOIN users u ON u.userId = sa.studentId
       LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
       LEFT JOIN applications a ON a.applicationId = sa.applicationId
      WHERE r.hallId = ?
        AND sa.status IN ('ALLOCATED','ACTIVE')
        AND sa.vacatedDate IS NULL
        AND sa.startDate <= NOW()
        AND (sa.endDate IS NULL OR sa.endDate >= NOW())
        AND (? IS NULL OR sp.department = ?)
        AND (? IS NULL OR sp.sessionYear = ?)
        AND (? IS NULL OR a.formId = ?)
      ORDER BY sp.department ASC, sp.sessionYear ASC, u.name ASC`,
    [hallId, dept, dept, sess, sess, fId, fId]
  );

  return (rows || []).map((r) => ({
    studentId: r.studentUniversityId || null,
    name: r.studentName || "Unknown",
    department: r.studentDepartment || null,
    session: r.studentSessionYear || null,
    totalScore: r.totalScore != null ? Number(r.totalScore) : null,
    room: {
      roomNumber: r.roomNumber || null,
      floorNumber: r.floorNumber != null ? Number(r.floorNumber) : null,
    },
  }));
}

async function getCurrentResidentFilterOptionsForHall(hallId) {
  if (!hallId) return { departments: [], sessions: [] };
  const pool = await initPool();
  const [deptRows, sessionRows] = await Promise.all([
    pool.query(
      `SELECT DISTINCT sp.department AS value
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE r.hallId = ?
          AND sa.status IN ('ALLOCATED','ACTIVE')
          AND sa.vacatedDate IS NULL
          AND sa.startDate <= NOW()
          AND (sa.endDate IS NULL OR sa.endDate >= NOW())
          AND sp.department IS NOT NULL
          AND TRIM(sp.department) <> ''
        ORDER BY sp.department ASC`,
      [hallId]
    ),
    pool.query(
      `SELECT DISTINCT sp.sessionYear AS value
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE r.hallId = ?
          AND sa.status IN ('ALLOCATED','ACTIVE')
          AND sa.vacatedDate IS NULL
          AND sa.startDate <= NOW()
          AND (sa.endDate IS NULL OR sa.endDate >= NOW())
          AND sp.sessionYear IS NOT NULL
          AND TRIM(sp.sessionYear) <> ''
        ORDER BY sp.sessionYear ASC`,
      [hallId]
    ),
  ]);

  return {
    departments: (deptRows?.[0] || []).map((r) => String(r.value)),
    sessions: (sessionRows?.[0] || []).map((r) => String(r.value)),
  };
}

async function getFormFunnelByFormIdForHall(
  hallId,
  formId,
  allocationStatuses = ["ALLOCATED", "ACTIVE"]
) {
  if (!hallId || !formId) {
    return { applications: 0, allocated: 0, waiting: 0 };
  }

  const pool = await initPool();
  const wantedAllocations =
    Array.isArray(allocationStatuses) && allocationStatuses.length
      ? allocationStatuses
      : ["ALLOCATED", "ACTIVE"];

  const [appsRows, allocRows, waitRows] = await Promise.all([
    pool.query(
      `SELECT COUNT(DISTINCT a.applicationId) AS total
         FROM applications a
        WHERE a.hallId = ?
          AND a.formId = ?`,
      [hallId, formId]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT sa.studentId) AS total
         FROM student_allocations sa
         JOIN applications a ON a.applicationId = sa.applicationId
         JOIN rooms r ON r.roomId = sa.roomId
        WHERE a.hallId = ?
          AND a.formId = ?
          AND r.hallId = ?
          AND sa.status IN (?)`,
      [hallId, formId, hallId, wantedAllocations]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT wl.studentId) AS total
         FROM waitlist_entries wl
         JOIN applications a ON a.applicationId = wl.applicationId
        WHERE wl.hallId = ?
          AND a.hallId = ?
          AND a.formId = ?
          AND wl.status = 'ACTIVE'`,
      [hallId, hallId, formId]
    ),
  ]);

  const appsRow = appsRows?.[0]?.[0];
  const allocRow = allocRows?.[0]?.[0];
  const waitRow = waitRows?.[0]?.[0];

  return {
    applications: Number(appsRow?.total || 0),
    allocated: Number(allocRow?.total || 0),
    waiting: Number(waitRow?.total || 0),
  };
}

module.exports = {
  getRegisteredStudentCountByHallId,
  getAllocatedStudentCountByHallId,
  getAllocatedStudentsBySessionForHall,
  getSessionFunnelBySessionForHall,
  getSessionFunnelBySessionForHallAndFormId,
  getFormFunnelByFormIdForHall,
  listCurrentResidentsForHall,
  getCurrentResidentFilterOptionsForHall,
};
