const {
  getRegisteredStudentCountByHallId,
  getAllocatedStudentCountByHallId,
  getAllocatedStudentsBySessionForHall,
  getSessionFunnelBySessionForHall,
  getSessionFunnelBySessionForHallAndFormId,
  getFormFunnelByFormIdForHall,
  listCurrentResidentsForHall,
  getCurrentResidentFilterOptionsForHall,
} = require("../repositories/dashboardRepository");

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "admin";
}

async function getMyHallOverview(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view dashboard stats");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const [registeredStudents, allocatedStudents, sessionFunnel] =
      await Promise.all([
        getRegisteredStudentCountByHallId(hallId),
        getAllocatedStudentCountByHallId(hallId),
        getSessionFunnelBySessionForHall(hallId),
      ]);

    const allocatedBySession = Array.isArray(sessionFunnel)
      ? sessionFunnel.map((x) => ({
          sessionYear: x?.sessionYear,
          count: Number(x?.allocated || 0),
        }))
      : await getAllocatedStudentsBySessionForHall(hallId);

    res.json({
      success: true,
      data: {
        hallId,
        registeredStudents,
        allocatedStudents,
        allocatedBySession,
        sessionFunnel,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMyHallFormFunnel(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view dashboard stats");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const formId = req.params.formId;
    if (!formId) {
      const err = new Error("Form id is required");
      err.status = 400;
      throw err;
    }

    const data = await getFormFunnelByFormIdForHall(hallId, formId);

    res.json({
      success: true,
      data: {
        hallId,
        formId,
        ...data,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMyHallFormSessionFunnel(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view dashboard stats");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const formId = req.params.formId;
    if (!formId) {
      const err = new Error("Form id is required");
      err.status = 400;
      throw err;
    }

    const sessionFunnel = await getSessionFunnelBySessionForHallAndFormId(
      hallId,
      formId
    );

    res.json({
      success: true,
      data: {
        hallId,
        formId,
        sessionFunnel,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyHallOverview,
  getMyHallFormFunnel,
  getMyHallFormSessionFunnel,
  getMyHallResidentFilters,
  getMyHallResidents,
};

async function getMyHallResidentFilters(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view dashboard stats");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const data = await getCurrentResidentFilterOptionsForHall(hallId);
    res.json({ success: true, data: { hallId, ...data } });
  } catch (err) {
    next(err);
  }
}

async function getMyHallResidents(req, res, next) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    if (!isAdmin(req.user)) {
      const err = new Error("Only admins can view dashboard stats");
      err.status = 403;
      throw err;
    }

    const hallId = req.user.hallId;
    if (!hallId) {
      const err = new Error("Admin hall not found");
      err.status = 400;
      throw err;
    }

    const {
      department = null,
      sessionYear = null,
      formId = null,
    } = req.query || {};

    const residents = await listCurrentResidentsForHall({
      hallId,
      department,
      sessionYear,
      formId,
    });

    res.json({
      success: true,
      data: {
        hallId,
        filters: {
          department: department || null,
          sessionYear: sessionYear || null,
          formId: formId || null,
        },
        residents,
      },
    });
  } catch (err) {
    next(err);
  }
}
