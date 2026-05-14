import logger from '../config/logger.js';
import { env } from '../config/env.js';
import ApiResponse from '../core/response/ApiResponse.js';

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  const response = {
    ...ApiResponse.error(message, statusCode),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error(`[Error] ${req.method} ${req.path} - ${message}`);
    if (err.stack) logger.error(err.stack);
  } else {
    logger.warn(`[Warn] ${req.method} ${req.path} - ${message}`);
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
