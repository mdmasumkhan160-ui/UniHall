const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyComplaintEligibility,
  createMyComplaint,
  listMyComplaints,
  listHallComplaints,
  updateHallComplaintStatus,
} = require("../controllers/complaintController");

const router = express.Router();
router.use(authMiddleware);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Student
router.get("/student/eligibility", getMyComplaintEligibility);
router.get("/student", listMyComplaints);
router.post("/student", upload.single("file"), createMyComplaint);

// Admin/staff
router.get("/", listHallComplaints);
router.post("/:complaintId/status", updateHallComplaintStatus);

module.exports = router;
