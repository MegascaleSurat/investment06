const { AppError } = require('../core/errors/AppError');
const { logger } = require('../core/logger');

function errorHandler(err, req, res, _next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  const payload = {
    error: {
      message: isAppError ? err.message : 'Internal Server Error',
      code: isAppError ? err.code : 'INTERNAL_ERROR',
      details: isAppError ? err.details : undefined,
      requestId: req.id
    }
  };

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id }, 'Unhandled error');
  } else {
    logger.warn({ err, requestId: req.id }, 'Request error');
  }

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };

