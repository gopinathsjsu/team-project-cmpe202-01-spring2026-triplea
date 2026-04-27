const { errorResponse } = require("../utils/responseHandler");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Unauthorized");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "Forbidden: insufficient permissions");
    }

    return next();
  };
}

module.exports = {
  authorizeRoles,
};
