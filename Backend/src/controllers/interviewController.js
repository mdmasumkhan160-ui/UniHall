const {
  listInterviewsByHallId,
  updateInterviewScoreByHallId,
  getInterviewApplicationMetaByHallId,
} = require("../repositories/interviewRepository");

const {
  getFormById,
  getApplicationDetailsById,
} = require("../repositories/formRepository");

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "admin";
}

async function listMyHallInterviews(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view interviews");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const data = await listInterviewsByHallId(hallId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateMyHallInterviewScore(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can update interview score");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const body = req.body || {};
    const data = await updateInterviewScoreByHallId({
      interviewId: req.params.interviewId,
      hallId,
      interviewScore: body.interviewScore,
      updatedBy: req.user.userId || null,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getMyHallInterviewApplicationDetails(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error(
        "Only admins can view interview application details"
      );
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const meta = await getInterviewApplicationMetaByHallId(
      req.params.interviewId,
      hallId
    );
    const application = await getApplicationDetailsById(
      meta.applicationId,
      hallId
    );
    const form = await getFormById(meta.formId);

    res.json({
      success: true,
      data: {
        interviewId: meta.interviewId,
        application,
        form: {
          id: form?.id,
          title: form?.title,
          schema: Array.isArray(form?.schema) ? form.schema : [],
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyHallInterviews,
  updateMyHallInterviewScore,
  getMyHallInterviewApplicationDetails,
};
