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

/** Sets req.optionalUser when a valid Bearer token is present; otherwise null (no error). */
function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.optionalUser = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    req.optionalUser = verifyToken(token);
  } catch (error) {
    req.optionalUser = null;
  }
  return next();
}

module.exports = {
  authenticateToken,
  authenticateTokenOptional,
};
