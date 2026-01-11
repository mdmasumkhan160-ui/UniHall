const examRepository = require("../repositories/examRepository");
const notificationRepository = require("../repositories/notificationRepository");

/**
 * Get exam controller profile
 */
async function getProfile(userId) {
  return await examRepository.getExamControllerProfile(userId);
}

/**
 * Update exam controller profile
 */
async function updateProfile(userId, data) {
  return await examRepository.upsertExamControllerProfile({
    userId,
    ...data,
  });
}

/**
 * Create seat plan with PDF upload
 */
async function createSeatPlan(data, userId) {
  // Create attachment first
  const attachmentId = await examRepository.createAttachment({
    entityType: "SEAT_PLAN",
    entityId: "pending",
    fileName: data.fileName,
    fileType: data.fileType,
    fileUrl: data.fileUrl,
    createdBy: userId,
  });

  // Create seat plan
  const seatPlan = await examRepository.createSeatPlan({
    ...data,
    attachmentId,
    createdBy: userId,
  });

  // If visible, send notification to students
  if (data.isVisible) {
    await notifyStudentsAboutSeatPlan(seatPlan);
  }

  return seatPlan;
}

/**
 * Update seat plan visibility
 */
async function updateSeatPlanVisibility(planId, isVisible, userId) {
  const seatPlan = await examRepository.updateSeatPlan(planId, { isVisible });

  // If made visible, send notification to students
  if (isVisible) {
    await notifyStudentsAboutSeatPlan(seatPlan);
  }

  return seatPlan;
}

/**
 * Create exam result with PDF upload
 */
async function createExamResult(data, userId) {
  // Create attachment first
  const attachmentId = await examRepository.createAttachment({
    entityType: "EXAM_RESULT",
    entityId: "pending",
    fileName: data.fileName,
    fileType: data.fileType,
    fileUrl: data.fileUrl,
    createdBy: userId,
  });

  // Create exam result
  const result = await examRepository.createExamResult({
    ...data,
    attachmentId,
    createdBy: userId,
  });

  // If visible, send notification to admins
  if (data.isVisible) {
    await notifyAdminsAboutResult(result);
  }

  return result;
}

/**
 * Update exam result visibility
 */
async function updateExamResultVisibility(resultId, isVisible, userId) {
  const result = await examRepository.updateExamResult(resultId, { isVisible });

  // If made visible, send notification to admins
  if (isVisible) {
    await notifyAdminsAboutResult(result);
  }

  return result;
}

/**
 * Send notification to students about new seat plan
 */
async function notifyStudentsAboutSeatPlan(seatPlan) {
  try {
    const message = `New seat plan published for ${seatPlan.examName} - ${seatPlan.semester} ${seatPlan.academicYear}`;
    const title = "New Exam Seat Plan Available";

    // Get the notification repository to send notifications
    // This will send to all students or filtered by department if needed
    await notificationRepository.createNotification({
      recipientType: "ROLE",
      recipientId: "student",
      title,
      message,
      category: "EXAM",
      priority: "HIGH",
      metadata: JSON.stringify({
        planId: seatPlan.planId,
        examName: seatPlan.examName,
        department: seatPlan.department,
      }),
      sentBy: seatPlan.created_by,
    });
  } catch (error) {
    console.error("Failed to send seat plan notification:", error);
  }
}

/**
 * Send notification to admins about new exam result
 */
async function notifyAdminsAboutResult(result) {
  try {
    const message = `New exam result uploaded: ${result.title} - ${result.semester} ${result.academicYear}`;
    const title = "New Exam Result Available";

    await notificationRepository.createNotification({
      recipientType: "ROLE",
      recipientId: "admin",
      title,
      message,
      category: "EXAM",
      priority: "MEDIUM",
      metadata: JSON.stringify({
        resultId: result.resultId,
        title: result.title,
        department: result.department,
      }),
      sentBy: result.created_by,
    });
  } catch (error) {
    console.error("Failed to send result notification:", error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  createSeatPlan,
  updateSeatPlanVisibility,
  createExamResult,
  updateExamResultVisibility,
};
