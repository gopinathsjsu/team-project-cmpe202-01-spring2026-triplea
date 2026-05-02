const { verifyToken } = require("../utils/jwtUtils");
const { errorResponse } = require("../utils/responseHandler");

// Protect routes by validating Bearer access tokens.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return errorResponse(res, 401, "Unauthorized");
  }
}

module.exports = {
  authenticateToken,
};
