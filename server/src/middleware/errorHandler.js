import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
};

export default errorHandler;
