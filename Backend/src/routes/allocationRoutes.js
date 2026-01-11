const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMyHallAllocations,
  listMyHallAllocationCandidates,
  assignSeatToCandidate,
  updateMyHallAllocation,
  deleteMyHallAllocation,
  searchMyHallStudents,
  manualAssignSeat,
} = require("../controllers/allocationController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", listMyHallAllocations);
router.get("/candidates", listMyHallAllocationCandidates);
router.get("/manual-search", searchMyHallStudents);
router.post("/assign", assignSeatToCandidate);
router.post("/manual-assign", manualAssignSeat);
router.put("/:allocationId", updateMyHallAllocation);
router.delete("/:allocationId", deleteMyHallAllocation);

module.exports = router;
