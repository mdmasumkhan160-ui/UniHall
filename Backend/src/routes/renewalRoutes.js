const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyRenewalEligibility,
  createMyRenewal,
  listMyRenewals,
  listHallRenewals,
  decideHallRenewal,
} = require("../controllers/renewalController");

const router = express.Router();
router.use(authMiddleware);

// Student endpoints
router.get("/student/eligibility", getMyRenewalEligibility);
router.get("/student", listMyRenewals);
router.post("/student", createMyRenewal);

// Admin endpoints
router.get("/", listHallRenewals);
router.post("/:renewalId/decision", decideHallRenewal);

module.exports = router;
