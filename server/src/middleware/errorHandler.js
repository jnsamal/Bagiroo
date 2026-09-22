// Centralized error handling — no stack traces or internals leak to the
// client in production; every response follows the same shape.

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const validation = err.name === 'ZodError';
  const statusCode = err.statusCode || (validation ? 400 : err.code === 'P2002' ? 409 : err.code === 'P2025' ? 404 : err.code === 'P2003' ? 409 : 500);
  const isProd = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: validation ? err.issues.map(issue => `${issue.path.join('.') || 'Form'}: ${issue.message}`).join('; ') : err.code === 'P2002' ? 'This value is already in use. Choose a unique value.' : err.code === 'P2025' ? 'Record not found.' : err.code === 'P2003' ? 'This record is linked to other data. Update its links before removing it.' : isProd && statusCode >= 500 ? 'Something went wrong.' : err.message,
      details: validation ? err.issues : err.details || undefined,
    },
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
