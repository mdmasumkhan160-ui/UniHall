const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  addDisciplinaryRecord,
  listDisciplinaryRecords,
  getDisciplinaryRecord,
  updateRecord,
  deleteRecord,
  searchStudents,
} = require("../controllers/disciplinaryRecordController");

const router = express.Router();
router.use(authMiddleware);

// Search for students in the hall
router.get("/search/students", searchStudents);

// Create new disciplinary record
router.post("/", addDisciplinaryRecord);

// List disciplinary records for the hall
router.get("/", listDisciplinaryRecords);

// Get a specific record
router.get("/:recordId", getDisciplinaryRecord);

// Update a record
router.put("/:recordId", updateRecord);

// Delete (soft delete) a record
router.delete("/:recordId", deleteRecord);

module.exports = router;
