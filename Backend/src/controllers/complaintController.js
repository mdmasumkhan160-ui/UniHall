const {
  getActiveAllocationForStudent,
  createComplaint,
  listComplaintsByStudent,
  listComplaintsByHall,
  updateComplaintStatus,
} = require("../repositories/complaintRepository");

function role(user) {
  return String(user?.role || "").toLowerCase();
}

async function getMyComplaintEligibility(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (role(req.user) !== "student") {
      const err = new Error("Only students can access complaint eligibility");
      err.status = 403;
      throw err;
    }

    const allocation = await getActiveAllocationForStudent(req.user.userId);
    if (!allocation) {
      return res.json({ success: true, data: { eligible: false } });
    }
    res.json({ success: true, data: { eligible: true, allocation } });
  } catch (e) {
    next(e);
  }
}

async function createMyComplaint(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (role(req.user) !== "student") {
      const err = new Error("Only students can file complaints");
      err.status = 403;
      throw err;
    }

    const body = req.body || {};
    
    // Handle file upload
    let attachmentData = null;
    if (req.file) {
      attachmentData = {
        name: req.file.originalname,
        type: req.file.mimetype,
        data: req.file.buffer,
        filename: req.file.filename,
      };
    }
    
    const data = await createComplaint({
      studentId: req.user.userId,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      attachment: attachmentData,
    });

    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listMyComplaints(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (role(req.user) !== "student") {
      const err = new Error("Only students can view their complaints");
      err.status = 403;
      throw err;
    }
    const data = await listComplaintsByStudent(req.user.userId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listHallComplaints(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can review complaints");
      err.status = 403;
      throw err;
    }
    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }
    const data = await listComplaintsByHall(hallId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function updateHallComplaintStatus(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    const r = role(req.user);
    if (r !== "admin" && r !== "staff") {
      const err = new Error("Only admins/staff can update complaints");
      err.status = 403;
      throw err;
    }
    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Hall not found");
      err.status = 400;
      throw err;
    }

    const complaintId = req.params.complaintId;
    const { status, resolutionDetails } = req.body || {};

    const data = await updateComplaintStatus({
      complaintId,
      hallId,
      status,
      resolutionDetails,
      updatedBy: req.user.userId || null,
    });

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getMyComplaintEligibility,
  createMyComplaint,
  listMyComplaints,
  listHallComplaints,
  updateHallComplaintStatus,
};
