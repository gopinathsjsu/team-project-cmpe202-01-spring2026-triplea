const { errorResponse } = require("../utils/responseHandler");
const { isPositiveIntegerEventId } = require("../utils/validation");

function validateEventIdParam(req, res, next) {
  const { id } = req.params;
  if (!isPositiveIntegerEventId(id)) {
    return errorResponse(res, 400, "Invalid event id");
  }
  return next();
}

module.exports = {
  validateEventIdParam,
};
