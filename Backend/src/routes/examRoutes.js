const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadSeatPlan,
  getSeatPlans,
  getSeatPlanById,
  updateSeatPlanVisibility,
  deleteSeatPlan,
  uploadExamResult,
  getExamResults,
  getExamResultById,
  updateExamResultVisibility,
  deleteExamResult,
  pushNotification,
  getFilterOptions,
} = require("../controllers/examController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Seat plan routes
router.post("/seat-plans", uploadSeatPlan);
router.get("/seat-plans", getSeatPlans);
router.get("/seat-plans/:planId", getSeatPlanById);
router.patch("/seat-plans/:planId/visibility", updateSeatPlanVisibility);
router.delete("/seat-plans/:planId", deleteSeatPlan);

// Exam result routes
router.post("/results", uploadExamResult);
router.get("/results", getExamResults);
router.get("/results/:resultId", getExamResultById);
router.patch("/results/:resultId/visibility", updateExamResultVisibility);
router.delete("/results/:resultId", deleteExamResult);

// Notification routes
router.post("/notifications", pushNotification);

// Filter options
router.get("/filters", getFilterOptions);

module.exports = router;
