const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'An unexpected error occurred.';
  let errors = error.errors;

  // Invalid MongoDB ObjectId (e.g. /api/projects/not-an-id)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The requested record could not be found because its identifier is invalid.';
    errors = undefined;
  }

  // Mongoose schema validation
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please correct the highlighted fields.';
    errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, value]) => [field, value.message]),
    );
  }

  // Duplicate unique key (currently email)
  if (error.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(error.keyValue || {})[0] || 'field';
    message =
      duplicateField === 'email'
        ? 'An account with this email address already exists.'
        : 'A record with these details already exists.';
    errors = { [duplicateField]: message };
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please sign in again.';
  }

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'The request body contains invalid JSON.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

module.exports = { notFound, errorHandler };
