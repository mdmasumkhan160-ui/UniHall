const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMyHallRooms,
  createMyHallRoom,
  updateMyHallRoom,
  deleteMyHallRoom,
} = require("../controllers/roomController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", listMyHallRooms);
router.post("/", createMyHallRoom);
router.put("/:roomId", updateMyHallRoom);
router.delete("/:roomId", deleteMyHallRoom);

module.exports = router;
