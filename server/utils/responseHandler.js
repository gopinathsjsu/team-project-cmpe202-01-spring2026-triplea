// Send a consistent success response payload.
function successResponse(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

// Send a consistent error response payload.
function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};
