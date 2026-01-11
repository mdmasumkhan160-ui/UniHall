const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const formRoutes = require("./formRoutes");
const notificationRoutes = require("./notificationRoutes");
const roomRoutes = require("./roomRoutes");
const allocationRoutes = require("./allocationRoutes");
const interviewRoutes = require("./interviewRoutes");
const waitlistRoutes = require("./waitlistRoutes");
const renewalRoutes = require("./renewalRoutes");
const complaintRoutes = require("./complaintRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const disciplinaryRecordRoutes = require("./disciplinaryRecordRoutes");
const examRoutes = require("./examRoutes");
const studentRoutes = require("./studentRoutes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/forms", formRoutes);
router.use("/notifications", notificationRoutes);
router.use("/rooms", roomRoutes);
router.use("/allocations", allocationRoutes);
router.use("/interviews", interviewRoutes);
router.use("/waitlist", waitlistRoutes);
router.use("/renewals", renewalRoutes);
router.use("/complaints", complaintRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/disciplinary-records", disciplinaryRecordRoutes);
router.use("/exam", examRoutes);
router.use("/students", studentRoutes);

module.exports = router;
