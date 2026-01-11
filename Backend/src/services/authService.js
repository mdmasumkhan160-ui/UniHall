const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  findUserById,
  findUserByEmailOrStudentId,
  findUserByEmail,
  updateLastLogin,
  createStudentUser,
  findHallByCode,
  findStudentProfileByUserId,
  upsertStudentProfile,
  findAdminProfileByUserId,
  upsertAdminProfile,
  findStaffProfileByUserId,
  upsertStaffProfile,
  findExamControllerProfileByUserId,
  upsertExamControllerProfile,
  updateUserBasicInfo,
  updateUserPassword,
} = require("../repositories/userRepository");
const { generateToken } = require("../utils/token");

function mapRole(role) {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "STUDENT":
      return "student";
    case "STAFF":
      return "staff";
    case "EXAM_CONTROLLER":
      return "examcontroller";
    default:
      return role ? role.toLowerCase() : "student";
  }
}

function buildClientUser(row) {
  if (!row) return null;
  return {
    id: row.userId,
    userId: row.userId,
    email: row.email,
    name: row.name,
    role: mapRole(row.role),
    hallId: row.hallId || null,
    studentId: row.studentId || null,
    sessionYear: row.sessionYear || null,
    session: row.sessionYear || null,
    lastLogin: row.lastLogin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function login(identifier, password) {
  const trimmed = identifier.trim();
  const emailCandidate = trimmed.toLowerCase();
  const studentCandidate = trimmed.toUpperCase();
  const user = await findUserByEmailOrStudentId(
    emailCandidate,
    studentCandidate
  );
  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  await updateLastLogin(user.userId);

  const clientUser = buildClientUser(user);
  const token = generateToken(user.userId);
  return { token, user: clientUser };
}

function inferDepartmentFromStudentId(studentId) {
  // Student ID format: HALL(3) + Session(2) + Department(2) + Roll(3) + Gender(1)
  // Example: MUH2225013M -> dept code is "25"
  if (!studentId || studentId.length < 7) return "General";
  const segment = studentId.slice(5, 7);
  const map = {
    "01": "CSTE",
    "02": "FIMS",
    "03": "Pharmacy",
    "04": "ACCE",
    "05": "MBG",
    "06": "A. Math",
    "07": "ENG",
    "08": "FTNS",
    "09": "ESDM",
    10: "DBA",
    11: "ICE",
    12: "Economics",
    13: "BGE",
    14: "Agri",
    15: "Stat",
    16: "Political Science",
    17: "EEE",
    18: "OCN",
    19: "Education",
    20: "Sociology",
    21: "THM",
    22: "MIS",
    23: "BMB",
    24: "IIS",
    25: "IIT",
    26: "Bangla",
    27: "Law",
    28: "Zoology",
    29: "Educational Administration",
    30: "Social Work",
    31: "Physics",
    32: "Chemistry",
    33: "SWES",
  };
  return map[segment] || "General";
}

function deriveSessionYearFromStudentId(studentId) {
  if (!studentId || studentId.length < 5) return null;
  const fragment = studentId.slice(3, 5);
  if (!/^[0-9]{2}$/.test(fragment)) return null;

  const numeric = Number.parseInt(fragment, 10);
  if (!Number.isFinite(numeric)) return null;

  const startYear = 2000 + Math.max(numeric - 1, 0);
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
}

function isValidStudentEmail(email) {
  return /^[^@]+@student\.nstu\.edu\.bd$/i.test(email);
}

function isValidStudentId(studentId) {
  return /^[A-Z]{3}[0-9A-Z]{6,}$/i.test(studentId);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function normalizeProgramLevel(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (v === "masters" || v === "master" || v === "msc" || v === "ms")
    return "masters";
  if (v === "phd" || v === "ph.d" || v === "doctorate") return "phd";
  return "undergraduate";
}

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

async function registerStudent({ name, email, password, studentId }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedStudentId = studentId.trim().toUpperCase();

  if (!isValidStudentEmail(normalizedEmail)) {
    throw new Error("Only @student.nstu.edu.bd emails are allowed");
  }

  if (!isValidStudentId(normalizedStudentId)) {
    throw new Error("Invalid student ID format");
  }

  const existingUser = await findUserByEmailOrStudentId(
    normalizedEmail,
    normalizedStudentId
  );
  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new Error("Email already registered");
    }
    if (existingUser.studentId === normalizedStudentId) {
      throw new Error("Student ID already registered");
    }
  }

  const existingById = await findUserById(normalizedStudentId);
  if (existingById) {
    throw new Error("Student ID already registered");
  }

  const hallCode = normalizedStudentId.slice(0, 3);
  const hallId = hallCode ? await findHallByCode(hallCode) : null;
  if (!hallId) {
    throw new Error("Student ID prefix does not match any hall");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = normalizedStudentId;
  const department = inferDepartmentFromStudentId(normalizedStudentId);
  const sessionYear = deriveSessionYearFromStudentId(normalizedStudentId);
  if (!sessionYear) {
    throw new Error("Unable to determine session from student ID");
  }

  await createStudentUser({
    userId,
    email: normalizedEmail,
    hashedPassword,
    name,
    hallId,
    studentId: normalizedStudentId,
    programLevel: "undergraduate",
    department,
    sessionYear,
  });

  const created = await findUserById(userId);
  const token = generateToken(userId);
  return { token, user: buildClientUser(created) };
}

async function registerGraduateStudent({
  name,
  email,
  password,
  studentId,
  programLevel,
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const level = normalizeProgramLevel(programLevel);
  const normalizedUniversityId = String(studentId || "")
    .trim()
    .toUpperCase();

  if (!isValidStudentEmail(normalizedEmail)) {
    throw new Error("Only @student.nstu.edu.bd emails are allowed");
  }

  const existingByEmail = await findUserByEmail(normalizedEmail);
  if (existingByEmail) {
    throw new Error("Email already registered");
  }

  if (!normalizedUniversityId) {
    throw new Error("Student ID is required");
  }
  if (normalizedUniversityId.length > 20) {
    throw new Error("Student ID is too long");
  }

  const existingByUniversityId = await findUserByEmailOrStudentId(
    normalizedEmail,
    normalizedUniversityId
  );
  if (
    existingByUniversityId &&
    existingByUniversityId.studentId === normalizedUniversityId
  ) {
    throw new Error("Student ID already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // Masters/PhD: infer hall from the first 3 letters of universityId (hallCode).
  // We still do NOT infer department/session.
  const hallCode = normalizedUniversityId.slice(0, 3).toUpperCase();
  const canInferHall = /^[A-Z]{3}$/.test(hallCode);
  const hallId = canInferHall ? await findHallByCode(hallCode) : null;
  if (!hallId) {
    throw new Error("University ID prefix does not match any hall");
  }

  await createStudentUser({
    userId,
    email: normalizedEmail,
    hashedPassword,
    name,
    hallId,
    studentId: normalizedUniversityId,
    programLevel: level,
    department: level === "undergraduate" ? "General" : "Not provided",
    sessionYear: null,
  });

  const created = await findUserById(userId);
  const token = generateToken(userId);
  return { token, user: buildClientUser(created) };
}

async function fetchCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return buildClientUser(user);
}

function mapStudentProfile(row) {
  if (!row) return null;
  return {
    type: "student",
    userId: row.userId,
    hallId: row.hallId || null,
    hallName: row.hallName || null,
    hallCode: row.hallCode || null,
    universityId: row.universityId || null,
    programLevel: row.programLevel || null,
    phone: row.phone || null,
    address: row.address || null,
    department: row.department || null,
    session: row.sessionYear || null,
    sessionYear: row.sessionYear || null,
    photoUrl: row.photoUrl || null,
    studentIdCardUrl: row.studentIdCardUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAdminProfile(row) {
  if (!row) return null;
  return {
    type: "admin",
    userId: row.userId,
    hallId: row.hallId || null,
    hallName: row.hallName || null,
    hallCode: row.hallCode || null,
    designation: row.designation || null,
    officeLocation: row.officeLocation || null,
    phone: row.phone || null,
    photoUrl: row.photoUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStaffProfile(row) {
  if (!row) return null;
  return {
    type: "staff",
    userId: row.userId,
    hallId: row.hallId || null,
    hallName: row.hallName || null,
    hallCode: row.hallCode || null,
    contact: row.contact || null,
    phone: row.phone || null,
    photoUrl: row.photoUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExamControllerProfile(row) {
  if (!row) return null;
  return {
    type: "examcontroller",
    userId: row.userId,
    contact: row.contact || null,
    phone: row.phone || null,
    photoUrl: row.photoUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeString(input, fallback = null) {
  if (input === undefined) return fallback;
  if (input === null) return null;
  const value = String(input).trim();
  return value.length ? value : null;
}

function sanitizePhoto(input, fallback = null) {
  if (input === undefined) return fallback;
  if (input === null) return null;
  const value = String(input).trim();
  if (!value) return null;

  // If a client sends a base64 data URL, persist it to disk and store a short URL.
  if (/^data:[^;]+;base64,/i.test(value)) {
    return saveBase64Upload({
      subdir: "profile-photos",
      dataUrl: value,
      maxBytes: 5_000_000,
    });
  }

  // Otherwise store the URL/path as-is (must fit DB column).
  if (value.length > 255) {
    const err = new Error("Profile photo URL is too long.");
    err.status = 400;
    throw err;
  }

  return value;
}

async function getProfile(userId) {
  const dbUser = await findUserById(userId);
  if (!dbUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  let profile = null;
  switch (dbUser.role) {
    case "STUDENT":
      profile = mapStudentProfile(await findStudentProfileByUserId(userId));
      break;
    case "ADMIN":
      profile = mapAdminProfile(await findAdminProfileByUserId(userId));
      break;
    case "STAFF":
      profile = mapStaffProfile(await findStaffProfileByUserId(userId));
      break;
    case "EXAM_CONTROLLER":
      profile = mapExamControllerProfile(
        await findExamControllerProfileByUserId(userId)
      );
      break;
    default:
      profile = null;
  }

  return {
    user: buildClientUser(dbUser),
    profile,
  };
}

async function updateStudentProfile(user, profileInput = {}) {
  const existing = await findStudentProfileByUserId(user.userId);

  // Undergraduate accounts (userId = roll) should be derived from the roll.
  // Masters/PhD accounts (userId = UUID) should NOT be auto-derived.
  const isGraduateAccount = isUuid(user.userId);

  // Never allow a profile update to clear hallId implicitly (e.g., when saving photo).
  // Only accept hallId when a non-empty value is provided.
  const rawHallId = Object.prototype.hasOwnProperty.call(profileInput, "hallId")
    ? sanitizeString(profileInput.hallId, null)
    : undefined;

  let hallId = existing?.hallId || user.hallId || null;
  if (rawHallId) {
    hallId = rawHallId;
  }

  // Never allow a profile update to clear universityId implicitly (or turn null into 'NULL').
  // Only accept universityId when a non-empty value is provided.
  const rawUniversityId = Object.prototype.hasOwnProperty.call(
    profileInput,
    "universityId"
  )
    ? sanitizeString(profileInput.universityId, null)
    : undefined;

  let universityId = existing?.universityId || user.studentId || null;
  if (rawUniversityId) {
    universityId = String(rawUniversityId).trim().toUpperCase();
  }

  const phone = sanitizeString(profileInput.phone, existing?.phone || null);
  const address = sanitizeString(
    profileInput.address,
    existing?.address || null
  );
  let department = sanitizeString(
    profileInput.department,
    existing?.department || null
  );
  // Never auto-derive session for graduate accounts.
  let sessionYear = existing?.sessionYear || null;
  const looksLikeUndergradRoll =
    !!universityId &&
    !String(universityId).toUpperCase().startsWith("PENDING") &&
    /^[A-Z]{3}[0-9]{2}[0-9]{2}/.test(String(universityId).toUpperCase());

  if (!isGraduateAccount && looksLikeUndergradRoll) {
    const hallCode = String(universityId).slice(0, 3).toUpperCase();
    const derivedHallId = hallCode ? await findHallByCode(hallCode) : null;
    const derivedSessionYear = deriveSessionYearFromStudentId(universityId);
    const derivedDepartment = inferDepartmentFromStudentId(universityId);

    if (derivedHallId) hallId = derivedHallId;
    if (derivedSessionYear) sessionYear = derivedSessionYear;
    if (derivedDepartment) department = derivedDepartment;
  }

  // Graduate accounts: infer hallId from the first 3 letters of universityId if hallId is not set.
  // Do not infer department/session.
  if (isGraduateAccount && !rawHallId && !hallId && universityId) {
    const code = String(universityId).slice(0, 3).toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) {
      const derivedHallId = await findHallByCode(code);
      if (derivedHallId) hallId = derivedHallId;
    }
  }
  const photoSource = profileInput.photoData ?? profileInput.photoUrl;
  const photoUrl = sanitizePhoto(photoSource, existing?.photoUrl || null);

  let studentIdCardUrl = existing?.studentIdCardUrl || null;
  if (profileInput.studentIdCardData) {
    studentIdCardUrl = saveBase64Upload({
      subdir: "student-id-cards",
      dataUrl: profileInput.studentIdCardData,
      maxBytes: 10_000_000,
    });
  }

  await upsertStudentProfile(user.userId, {
    hallId,
    universityId,
    phone,
    address,
    department,
    sessionYear,
    photoUrl,
    studentIdCardUrl,
  });
}

async function updateAdminProfile(user, profileInput = {}) {
  const existing = await findAdminProfileByUserId(user.userId);

  const hallId = existing?.hallId || user.hallId || null;
  const designation = existing?.designation || null;
  const officeLocation = existing?.officeLocation || null;
  const phone = sanitizeString(profileInput.phone, existing?.phone || null);
  const photoSource = profileInput.photoData ?? profileInput.photoUrl;
  const photoUrl = sanitizePhoto(photoSource, existing?.photoUrl || null);

  await upsertAdminProfile(user.userId, {
    hallId,
    designation,
    officeLocation,
    phone,
    photoUrl,
  });
}

async function updateStaffProfile(user, profileInput = {}) {
  const existing = await findStaffProfileByUserId(user.userId);

  const hallId = existing?.hallId || user.hallId || null;
  const contact = sanitizeString(
    profileInput.contact,
    existing?.contact || null
  );
  const phone = sanitizeString(profileInput.phone, existing?.phone || null);
  const photoSource = profileInput.photoData ?? profileInput.photoUrl;
  const photoUrl = sanitizePhoto(photoSource, existing?.photoUrl || null);

  await upsertStaffProfile(user.userId, {
    hallId,
    contact,
    phone,
    photoUrl,
  });
}

async function updateExamControllerProfile(user, profileInput = {}) {
  const existing = await findExamControllerProfileByUserId(user.userId);

  const contact = sanitizeString(
    profileInput.contact,
    existing?.contact || null
  );
  const phone = sanitizeString(profileInput.phone, existing?.phone || null);
  const photoSource = profileInput.photoData ?? profileInput.photoUrl;
  const photoUrl = sanitizePhoto(photoSource, existing?.photoUrl || null);

  await upsertExamControllerProfile(user.userId, {
    contact,
    phone,
    photoUrl,
  });
}

async function updateProfile(userId, payload = {}) {
  const dbUser = await findUserById(userId);
  if (!dbUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (dbUser.role !== "STUDENT") {
    const err = new Error("Profile updates are only available for students");
    err.status = 403;
    throw err;
  }

  if (payload.name !== undefined) {
    const name = sanitizeString(payload.name);
    if (!name) {
      const err = new Error("Name cannot be empty");
      err.status = 400;
      throw err;
    }
    await updateUserBasicInfo(userId, { name });
  }

  if (payload.email !== undefined) {
    const err = new Error("Email updates are not supported yet");
    err.status = 400;
    throw err;
  }

  const profileInput =
    payload.profile && typeof payload.profile === "object"
      ? payload.profile
      : {};

  await updateStudentProfile(dbUser, profileInput);

  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    const err = new Error("Current and new password are required");
    err.status = 400;
    throw err;
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    const err = new Error("New password must be at least 6 characters long");
    err.status = 400;
    throw err;
  }

  const user = await findUserById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    const err = new Error(
      "New password must be different from the current password"
    );
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, hashedPassword);

  return { message: "Password updated successfully" };
}

module.exports = {
  login,
  registerStudent,
  registerGraduateStudent,
  fetchCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
  deriveSessionYearFromStudentId,
  normalizeProgramLevel,
};
