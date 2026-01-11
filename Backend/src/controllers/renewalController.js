const {
  getActiveAllocationForStudent,
  findPendingRenewal,
  getRenewalByAllocationAndYear,
  createRenewalRequest,
  listRenewalsByStudent,
  listRenewalsByHall,
  updateRenewalDecisionForHall,
} = require("../repositories/renewalRepository");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  computeCancelDateFromSessionYear,
  startOfDay,
  daysBetween,
  computeEffectiveExpiryDate,
} = require("../utils/allocationExpiry");
const {
  createNotification,
} = require("../repositories/notificationRepository");

const RENEWAL_WINDOW_DAYS = 90;

function ensureUploadsDir(subdir) {
  const uploadsDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "uploads",
    subdir
  );
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function extensionFromDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:([^;]+);base64,/i);
  const mime = m?.[1]?.toLowerCase() || "";
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  return ".bin";
}

function saveBase64Upload({ subdir, dataUrl, maxBytes = 10_000_000 }) {
  const raw = String(dataUrl || "");
  if (!raw) return null;

  const base64 = raw.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) return null;
  if (buffer.length > maxBytes) {
    const mb = Math.round(maxBytes / 1_000_000);
    const err = new Error(
      `Uploaded file exceeds maximum allowed size (${mb} MB).`
    );
    err.status = 400;
    throw err;
  }

  const uploadsDir = ensureUploadsDir(subdir);
  const fileId = crypto.randomUUID();
  const ext = extensionFromDataUrl(raw);
  const safeName = `${fileId}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subdir}/${safeName}`;
}

function isStudent(user) {
  const role = String(user?.role || "").toLowerCase();
  return role === "student";
}

function isAdmin(user) {
  const role = String(user?.role || "").toLowerCase();
  return role === "admin";
}

async function getMyRenewalEligibility(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isStudent(req.user)) {
      const err = new Error("Only students can access renewal eligibility");
      err.status = 403;
      throw err;
    }

    const allocation = await getActiveAllocationForStudent(req.user.userId);
    if (!allocation) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: "You do not have an active hall allocation.",
        },
      });
    }

    const expiryDate = computeEffectiveExpiryDate({
      sessionYear: allocation?.sessionYear,
      startDate: allocation?.startDate,
      endDate: allocation?.endDate,
    });
    const daysLeft = expiryDate
      ? daysBetween(startOfDay(new Date()), startOfDay(expiryDate))
      : null;

    const canApplyRenewal =
      daysLeft !== null && daysLeft >= 0 && daysLeft <= RENEWAL_WINDOW_DAYS;

    res.json({
      success: true,
      data: {
        eligible: true,
        allocation,
        expiresAt: expiryDate ? expiryDate.toISOString() : null,
        daysLeft,
        renewalWindowDays: RENEWAL_WINDOW_DAYS,
        canApplyRenewal,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function createMyRenewal(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isStudent(req.user)) {
      const err = new Error("Only students can submit renewal requests");
      err.status = 403;
      throw err;
    }

    const { academicYear, remarks, attachment } = req.body || {};
    const normalizedAcademicYear = String(academicYear || "").trim();
    if (!normalizedAcademicYear) {
      const err = new Error("academicYear is required");
      err.status = 400;
      throw err;
    }
    if (normalizedAcademicYear.length > 10) {
      const err = new Error("academicYear is too long");
      err.status = 400;
      throw err;
    }

    const allocation = await getActiveAllocationForStudent(req.user.userId);
    if (!allocation) {
      const err = new Error("You do not have an active hall allocation");
      err.status = 400;
      throw err;
    }

    const expiryDate = computeEffectiveExpiryDate({
      sessionYear: allocation?.sessionYear,
      startDate: allocation?.startDate,
      endDate: allocation?.endDate,
    });
    if (!expiryDate) {
      const err = new Error(
        "Unable to determine your seat expiry date. Please contact hall admin."
      );
      err.status = 400;
      throw err;
    }
    const daysLeft = daysBetween(
      startOfDay(new Date()),
      startOfDay(expiryDate)
    );
    const canApplyRenewal =
      daysLeft !== null && daysLeft >= 0 && daysLeft <= RENEWAL_WINDOW_DAYS;
    if (!canApplyRenewal) {
      const err = new Error(
        "Renewal requests are allowed only within 3 months of seat expiry."
      );
      err.status = 400;
      throw err;
    }

    const att = attachment || null;
    const dataUrl = typeof att?.dataUrl === "string" ? att.dataUrl.trim() : "";
    if (!dataUrl) {
      const err = new Error("Proof document is required for renewal.");
      err.status = 400;
      throw err;
    }

    const savedUrl = saveBase64Upload({
      subdir: "renewals",
      dataUrl,
      maxBytes: 10_000_000,
    });
    if (!savedUrl) {
      const err = new Error("Invalid proof document.");
      err.status = 400;
      throw err;
    }

    const existingAny = await getRenewalByAllocationAndYear(
      allocation.allocationId,
      normalizedAcademicYear
    );
    if (existingAny?.renewalId) {
      const status = String(existingAny.status || "").toUpperCase();
      if (status === "REJECTED") {
        const err = new Error(
          "Your renewal request was rejected. You cannot submit another request for the same academic year."
        );
        err.status = 400;
        throw err;
      }
      if (status === "APPROVED") {
        const err = new Error(
          "Your renewal request was already approved for this academic year."
        );
        err.status = 400;
        throw err;
      }
      const err = new Error(
        "A renewal request is already pending for this academic year"
      );
      err.status = 400;
      throw err;
    }

    // Keep the pending check too (for safety if schema changes)
    const existingPending = await findPendingRenewal(
      allocation.allocationId,
      normalizedAcademicYear
    );
    if (existingPending) {
      const err = new Error(
        "A renewal request is already pending for this academic year"
      );
      err.status = 400;
      throw err;
    }

    const data = await createRenewalRequest({
      studentId: req.user.userId,
      allocationId: allocation.allocationId,
      academicYear: normalizedAcademicYear,
      remarks: typeof remarks === "string" ? remarks.trim() : null,
      attachment: {
        name:
          typeof att?.name === "string" && att.name.trim()
            ? att.name.trim()
            : "proof",
        type:
          typeof att?.type === "string" && att.type.trim()
            ? att.type.trim()
            : "application/octet-stream",
        url: savedUrl,
      },
    });

    // Notify student
    await createNotification({
      userId: req.user.userId,
      hallId: allocation?.room?.hallId || null,
      title: "Renewal Submitted",
      body: `Your renewal request for ${normalizedAcademicYear} has been submitted and is pending admin review.`,
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listMyRenewals(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isStudent(req.user)) {
      const err = new Error("Only students can view their renewal requests");
      err.status = 403;
      throw err;
    }
    const data = await listRenewalsByStudent(req.user.userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listHallRenewals(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view renewal requests");
      err.status = 403;
      throw err;
    }
    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }
    const data = await listRenewalsByHall(hallId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function decideHallRenewal(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can decide renewal requests");
      err.status = 403;
      throw err;
    }
    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const renewalId = req.params.renewalId;
    const { status, note, extendMonths } = req.body || {};
    const data = await updateRenewalDecisionForHall({
      renewalId,
      hallId,
      status,
      reviewedBy: req.user.userId || null,
      note,
      extendMonths,
    });

    // Notify student about decision
    const decision = String(status || "").toUpperCase();
    if (data?.studentId) {
      if (decision === "APPROVED") {
        const extra = data.expiresAt
          ? ` New seat expiry: ${String(data.expiresAt).slice(0, 10)}.`
          : "";
        await createNotification({
          userId: data.studentId,
          hallId,
          title: "Renewal Approved",
          body: `Your renewal request for ${
            data.academicYear || "the requested year"
          } was approved.${extra}`,
        });
      } else if (decision === "REJECTED") {
        await createNotification({
          userId: data.studentId,
          hallId,
          title: "Renewal Rejected",
          body: `Your renewal request for ${
            data.academicYear || "the requested year"
          } was rejected.`,
        });
      } else if (decision === "UNDER_REVIEW") {
        await createNotification({
          userId: data.studentId,
          hallId,
          title: "Renewal Under Review",
          body: `Your renewal request for ${
            data.academicYear || "the requested year"
          } is under review.`,
        });
      }
    }
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getMyRenewalEligibility,
  createMyRenewal,
  listMyRenewals,
  listHallRenewals,
  decideHallRenewal,
};
