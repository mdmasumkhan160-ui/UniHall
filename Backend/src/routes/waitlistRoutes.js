const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMyHallWaitlist,
  addMyHallWaitlistEntry,
  assignWaitlistEntry,
  deleteWaitlistEntries,
} = require("../controllers/waitlistController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", listMyHallWaitlist);
router.post("/", addMyHallWaitlistEntry);
router.post("/:entryId/assign", assignWaitlistEntry);
router.delete("/", deleteWaitlistEntries);

module.exports = router;
