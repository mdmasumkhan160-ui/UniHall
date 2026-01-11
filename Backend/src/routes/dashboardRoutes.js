const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyHallOverview,
  getMyHallFormFunnel,
  getMyHallFormSessionFunnel,
  getMyHallResidentFilters,
  getMyHallResidents,
} = require("../controllers/dashboardController");

const router = express.Router();
router.use(authMiddleware);

// Admin: stats for the current admin's hall
router.get("/hall-overview", getMyHallOverview);

// Admin: per-application-form funnel counts (applications/allocated/waiting)
router.get("/forms/:formId/funnel", getMyHallFormFunnel);

// Admin: per-application-form session funnel (last 5 sessions)
router.get("/forms/:formId/session-funnel", getMyHallFormSessionFunnel);

// Admin: current residents export (filters + list)
router.get("/residents/filters", getMyHallResidentFilters);
router.get("/residents", getMyHallResidents);

module.exports = router;
