const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMyHallInterviews,
  updateMyHallInterviewScore,
  getMyHallInterviewApplicationDetails,
} = require("../controllers/interviewController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", listMyHallInterviews);
router.get("/:interviewId/application", getMyHallInterviewApplicationDetails);
router.put("/:interviewId/score", updateMyHallInterviewScore);

module.exports = router;
