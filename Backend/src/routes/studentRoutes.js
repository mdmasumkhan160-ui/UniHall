const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getStudentProfile } = require("../controllers/studentController");

const router = express.Router();
router.use(authMiddleware);

router.get("/:studentId/profile", getStudentProfile);

module.exports = router;
