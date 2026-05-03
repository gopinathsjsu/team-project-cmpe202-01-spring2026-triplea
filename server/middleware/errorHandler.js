function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  if (err && err.stack) {
    console.error(err.stack);
  }

  let statusCode = 500;
  if (typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode <= 599) {
    statusCode = err.statusCode;
  } else if (typeof err.status === "number" && err.status >= 400 && err.status <= 599) {
    statusCode = err.status;
  }

  let message;
  if (statusCode >= 500) {
    message = "Internal Server Error";
  } else if (typeof err.message === "string" && err.message.trim()) {
    message = err.message.trim();
  } else {
    message = "Error";
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  errorHandler,
};
