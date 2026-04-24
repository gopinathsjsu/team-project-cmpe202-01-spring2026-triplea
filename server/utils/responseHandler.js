// Send a consistent success response payload.
function successResponse(res, data, message) {
  return res.status(200).json({
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
