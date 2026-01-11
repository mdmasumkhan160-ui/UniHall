const {
  login,
  registerStudent,
  registerGraduateStudent,
  normalizeProgramLevel,
} = require("../services/authService");

async function handleLogin(req, res, next) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }
    const result = await login(identifier.trim(), password);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === "Invalid credentials") {
      return res.status(401).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function handleRegister(req, res, next) {
  try {
    const { name, email, password, studentId, programLevel } = req.body;
    const level = normalizeProgramLevel(programLevel);
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const result =
      level === "undergraduate"
        ? await registerStudent({
            name: normalizedName,
            email: normalizedEmail,
            password,
            studentId: String(studentId).trim().toUpperCase(),
          })
        : await registerGraduateStudent({
            name: normalizedName,
            email: normalizedEmail,
            password,
            studentId: String(studentId).trim().toUpperCase(),
            programLevel: level,
          });

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (
      err.message === "Email already registered" ||
      err.message.includes("Student ID")
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function handleMe(req, res, next) {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleLogin,
  handleRegister,
  handleMe,
};
