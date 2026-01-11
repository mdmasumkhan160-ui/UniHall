const examRepository = require("../repositories/examRepository");
const examService = require("../services/examService");
const notificationRepository = require("../repositories/notificationRepository");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function role(user) {
  return String(user?.role || "").toLowerCase();
}

/**
 * Get exam controller profile
 * GET /api/exam/profile
 */
async function getProfile(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const userId = req.user.userId;
    const profile = await examRepository.getExamControllerProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Exam controller profile not found",
      });
    }

    return res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * Update exam controller profile
 * PUT /api/exam/profile
 */
async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller") {
      const err = new Error("Only exam controllers can update their profile");
      err.status = 403;
      throw err;
    }

    const userId = req.user.userId;
    const profile = await examService.updateProfile(userId, req.body);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload seat plan PDF
 * POST /api/exam/seat-plans
 */
async function uploadSeatPlan(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller") {
      const err = new Error("Only exam controllers can upload seat plans");
      err.status = 403;
      throw err;
    }

    const {
      examName,
      examDate,
      semester,
      academicYear,
      department,
      description,
      isVisible,
      fileData,
      fileName,
      fileType,
    } = req.body;

    // Validate required fields
    if (!examName || !examDate || !semester || !academicYear || !department || !fileData) {
      const err = new Error("Missing required fields");
      err.status = 400;
      throw err;
    }

    // Validate PDF file
    if (!fileType || !fileType.includes("pdf")) {
      const err = new Error("Only PDF files are allowed for seat plans");
      err.status = 400;
      throw err;
    }

    // Save the PDF file
    const uploadsDir = path.resolve(__dirname, "..", "..", "..", "uploads", "seat-plans");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(fileName) || ".pdf";
    const safeName = `${fileId}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    // Handle base64 data
    const base64 = String(fileData).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/seat-plans/${safeName}`;

    // Create seat plan
    const seatPlan = await examService.createSeatPlan(
      {
        examName,
        examDate,
        semester,
        academicYear,
        department,
        description,
        isVisible: isVisible || false,
        fileName: fileName || safeName,
        fileType,
        fileUrl,
      },
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Seat plan uploaded successfully",
      data: seatPlan,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all seat plans with filters
 * GET /api/exam/seat-plans
 */
async function getSeatPlans(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    const { semester, academicYear, department, limit, offset } = req.query;

    const filters = {
      semester,
      academicYear,
      department,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    // Students can only see visible seat plans
    if (r === "student") {
      filters.isVisible = true;
    }

    const seatPlans = await examRepository.listSeatPlans(filters);

    // listSeatPlans now returns { rows, count }
    return res.json({
      success: true,
      data: seatPlans.rows,
      count: seatPlans.count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get seat plan by ID
 * GET /api/exam/seat-plans/:planId
 */
async function getSeatPlanById(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const { planId } = req.params;
    const seatPlan = await examRepository.getSeatPlanById(planId);

    if (!seatPlan) {
      return res.status(404).json({
        success: false,
        message: "Seat plan not found",
      });
    }

    // Students can only view visible seat plans
    const r = role(req.user);
    if (r === "student" && !seatPlan.isVisible) {
      return res.status(403).json({
        success: false,
        message: "This seat plan is not available yet",
      });
    }

    return res.json({
      success: true,
      data: seatPlan,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update seat plan visibility
 * PATCH /api/exam/seat-plans/:planId/visibility
 */
async function updateSeatPlanVisibility(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller" && r !== "admin") {
      const err = new Error("Only exam controllers and admins can update visibility");
      err.status = 403;
      throw err;
    }

    const { planId } = req.params;
    const { isVisible } = req.body;

    if (isVisible === undefined) {
      const err = new Error("isVisible field is required");
      err.status = 400;
      throw err;
    }

    const seatPlan = await examService.updateSeatPlanVisibility(
      planId,
      isVisible,
      req.user.userId
    );

    return res.json({
      success: true,
      message: "Seat plan visibility updated",
      data: seatPlan,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete seat plan
 * DELETE /api/exam/seat-plans/:planId
 */
async function deleteSeatPlan(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller" && r !== "admin") {
      const err = new Error("Only exam controllers and admins can delete seat plans");
      err.status = 403;
      throw err;
    }

    const { planId } = req.params;
    await examRepository.deleteSeatPlan(planId);

    return res.json({
      success: true,
      message: "Seat plan deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload exam result PDF
 * POST /api/exam/results
 */
async function uploadExamResult(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller") {
      const err = new Error("Only exam controllers can upload exam results");
      err.status = 403;
      throw err;
    }

    const {
      semester,
      academicYear,
      department,
      title,
      description,
      isVisible,
      fileData,
      fileName,
      fileType,
    } = req.body;

    // Validate required fields
    if (!semester || !academicYear || !department || !title || !fileData) {
      const err = new Error("Missing required fields");
      err.status = 400;
      throw err;
    }

    // Validate PDF file
    if (!fileType || !fileType.includes("pdf")) {
      const err = new Error("Only PDF files are allowed for exam results");
      err.status = 400;
      throw err;
    }

    // Save the PDF file
    const uploadsDir = path.resolve(__dirname, "..", "..", "..", "uploads", "exam-results");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(fileName) || ".pdf";
    const safeName = `${fileId}${ext}`;
    const filePath = path.join(uploadsDir, path.basename(safeName));

    // Handle base64 data
    const base64 = String(fileData).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/exam-results/${safeName}`;

    // Create exam result
    const result = await examService.createExamResult(
      {
        semester,
        academicYear,
        department,
        title,
        description,
        isVisible: isVisible || false,
        fileName: fileName || safeName,
        fileType,
        fileUrl,
      },
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Exam result uploaded successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all exam results with filters
 * GET /api/exam/results
 */
async function getExamResults(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    
    // Students cannot view exam results
    if (r === "student") {
      return res.status(403).json({
        success: false,
        message: "Students are not authorized to view exam results",
      });
    }

    const { semester, academicYear, department, limit, offset } = req.query;

    const filters = {
      semester,
      academicYear,
      department,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    // Only show visible results to non-exam-controller roles
    if (r !== "examcontroller") {
      filters.isVisible = true;
    }

    const results = await examRepository.listExamResults(filters);

    // listExamResults now returns { rows, count }
    return res.json({
      success: true,
      data: results.rows,
      count: results.count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get exam result by ID
 * GET /api/exam/results/:resultId
 */
async function getExamResultById(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    
    // Students cannot view exam results
    if (r === "student") {
      return res.status(403).json({
        success: false,
        message: "Students are not authorized to view exam results",
      });
    }

    const { resultId } = req.params;
    const result = await examRepository.getExamResultById(resultId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Exam result not found",
      });
    }

    // Only show visible results to non-exam-controller roles
    if (r !== "examcontroller" && !result.isVisible) {
      return res.status(403).json({
        success: false,
        message: "This exam result is not available yet",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update exam result visibility
 * PATCH /api/exam/results/:resultId/visibility
 */
async function updateExamResultVisibility(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller" && r !== "admin") {
      const err = new Error("Only exam controllers and admins can update visibility");
      err.status = 403;
      throw err;
    }

    const { resultId } = req.params;
    const { isVisible } = req.body;

    if (isVisible === undefined) {
      const err = new Error("isVisible field is required");
      err.status = 400;
      throw err;
    }

    const result = await examService.updateExamResultVisibility(
      resultId,
      isVisible,
      req.user.userId
    );

    return res.json({
      success: true,
      message: "Exam result visibility updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete exam result
 * DELETE /api/exam/results/:resultId
 */
async function deleteExamResult(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller" && r !== "admin") {
      const err = new Error("Only exam controllers and admins can delete exam results");
      err.status = 403;
      throw err;
    }

    const { resultId } = req.params;
    await examRepository.deleteExamResult(resultId);

    return res.json({
      success: true,
      message: "Exam result deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Push notification about exams
 * POST /api/exam/notifications
 */
async function pushNotification(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const r = role(req.user);
    if (r !== "examcontroller") {
      const err = new Error("Only exam controllers can push notifications");
      err.status = 403;
      throw err;
    }

    const { title, message, recipientType, recipientId, category, priority, metadata } = req.body;

    if (!title || !message) {
      const err = new Error("Title and message are required");
      err.status = 400;
      throw err;
    }

    const notification = await notificationRepository.createNotification({
      recipientType: recipientType || "ROLE",
      recipientId: recipientId || "student",
      title,
      message,
      category: category || "EXAM",
      priority: priority || "MEDIUM",
      metadata: metadata ? JSON.stringify(metadata) : null,
      sentBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get filter options (departments, academic years)
 * GET /api/exam/filters
 */
async function getFilterOptions(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const departments = await examRepository.getDistinctDepartments();
    const academicYears = await examRepository.getDistinctAcademicYears();
    const semesters = await examRepository.getDistinctSemesters();

    return res.json({
      success: true,
      data: {
        departments,
        academicYears,
        semesters,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
