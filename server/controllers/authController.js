const { successResponse } = require("../utils/responseHandler");

async function registerUser(req, res) {
  return successResponse(res, {}, "Register route is ready");
}

module.exports = {
  registerUser,
};
