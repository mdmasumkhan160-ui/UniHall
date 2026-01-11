const { initPool } = require("../../config/db");
const {
  createNotification,
} = require("../repositories/notificationRepository");
const {
  expireAllocationSystem,
  extendAllocationEndDateSystem,
} = require("../repositories/allocationExpiryRepository");
const {
  computeEffectiveExpiryDate,
  startOfDay,
  daysBetween,
} = require("../utils/allocationExpiry");

const REMINDER_DAY_OFFSETS = [60, 30, 15, 7, 3, 1];

async function hasNotificationToday(userId, title, likeBody) {
  const pool = await initPool();
  const [rows] = await pool.query(
    `SELECT 1
       FROM notifications
      WHERE userId = ?
        AND title = ?
        AND DATE(created_at) = CURDATE()
        AND body LIKE ?
      LIMIT 1`,
    [userId, title, likeBody]
  );
  return rows.length > 0;
}

async function findRelevantRenewal(allocationId, cancelYear) {
  const pool = await initPool();
  const yearStr = String(cancelYear);

  // student-entered academicYear can be like "2026", "2026/2027", "2026-2027" etc.
  const [rows] = await pool.query(
    `SELECT renewalId, status, academicYear, applicationDate, reviewedAt
       FROM renewals
      WHERE allocationId = ?
        AND (academicYear LIKE CONCAT(?, '%') OR academicYear LIKE CONCAT('%', ?, '%'))
      ORDER BY applicationDate DESC
      LIMIT 1`,
    [allocationId, yearStr, yearStr]
  );
  return rows[0] || null;
}

async function sendOnceToday({
  userId,
  hallId,
  title,
  bodyText,
  dedupeContainsText,
}) {
  if (!userId) return;
  const exists = await hasNotificationToday(
    userId,
    title,
    `%${dedupeContainsText || ""}%`
  );
  if (exists) return;
  await createNotification({ userId, hallId, title, body: bodyText });
}

let isRunning = false;

async function runAllocationExpiryCycle() {
  if (isRunning) return { skipped: true };
  isRunning = true;

  const pool = await initPool();
  try {
    const [rows] = await pool.query(
      `SELECT sa.allocationId,
              sa.studentId,
              sa.status,
              sa.startDate,
              sa.endDate,
              r.hallId,
              sp.sessionYear
         FROM student_allocations sa
         JOIN rooms r ON r.roomId = sa.roomId
         LEFT JOIN student_profiles sp ON sp.userId = sa.studentId
        WHERE sa.status IN ('ALLOCATED','ACTIVE')`
    );

    const today = startOfDay(new Date());

    for (const row of rows) {
      const cancelDate = computeEffectiveExpiryDate({
        sessionYear: row.sessionYear,
        startDate: row.startDate,
        endDate: row.endDate,
      });
      if (!cancelDate) continue;

      const daysLeft = daysBetween(today, cancelDate);
      const cancelYear = cancelDate.getFullYear();
      const allocationId = row.allocationId;
      const studentId = row.studentId;
      const hallId = row.hallId;

      // Reminder notifications
      if (REMINDER_DAY_OFFSETS.includes(daysLeft)) {
        const body = `Your seat will be cancelled when ${cancelYear} starts. ${daysLeft} day(s) left to apply for renewal.`;
        await sendOnceToday({
          userId: studentId,
          hallId,
          title: "Renewal Reminder",
          bodyText: body,
          dedupeContainsText: `${cancelYear} starts`, // stable fragment in body
        });
      }

      // Expiry handling
      if (daysLeft <= 0) {
        const renewal = await findRelevantRenewal(allocationId, cancelYear);
        const status = String(renewal?.status || "").toUpperCase();

        if (status === "PENDING" || status === "UNDER_REVIEW") {
          await sendOnceToday({
            userId: studentId,
            hallId,
            title: "Renewal Pending",
            bodyText:
              "Your renewal request is pending admin decision. Your seat will not be cancelled until a decision is made.",
            dedupeContainsText: "pending admin decision",
          });
          continue;
        }

        if (status === "APPROVED") {
          // Extend by 1 year from cancel date.
          await extendAllocationEndDateSystem({
            allocationId,
            newEndDate: new Date(cancelYear + 1, 0, 1),
          });
          await sendOnceToday({
            userId: studentId,
            hallId,
            title: "Renewal Approved",
            bodyText: "Your renewal was approved. Your seat has been extended.",
            dedupeContainsText: "renewal was approved",
          });
          continue;
        }

        // No renewal or rejected => expire seat
        await expireAllocationSystem({
          allocationId,
          reason: "Auto-cancel: renewal not submitted/approved before expiry",
        });
        await sendOnceToday({
          userId: studentId,
          hallId,
          title: "Seat Cancelled",
          bodyText: `Your seat was cancelled because the 4-year allotment period ended and no active renewal was found for ${cancelYear}.`,
          dedupeContainsText: `no active renewal was found for ${cancelYear}`,
        });
      }
    }

    return { processed: rows.length };
  } finally {
    isRunning = false;
  }
}

function startAllocationExpiryScheduler() {
  if (
    String(process.env.DISABLE_ALLOCATION_EXPIRY || "").toLowerCase() === "true"
  ) {
    return;
  }

  // Run once on boot and then every 24 hours.
  runAllocationExpiryCycle().catch((e) => {
    console.error("[allocationExpiry] initial run failed:", e.message);
  });

  const intervalMs = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runAllocationExpiryCycle().catch((e) => {
      console.error("[allocationExpiry] scheduled run failed:", e.message);
    });
  }, intervalMs);
}

module.exports = { runAllocationExpiryCycle, startAllocationExpiryScheduler };
