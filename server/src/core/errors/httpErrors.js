const { AppError } = require('./AppError');

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details) {
    super(message, { statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details) {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED', details });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details) {
    super(message, { statusCode: 403, code: 'FORBIDDEN', details });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found', details) {
    super(message, { statusCode: 404, code: 'NOT_FOUND', details });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, { statusCode: 409, code: 'CONFLICT', details });
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};

