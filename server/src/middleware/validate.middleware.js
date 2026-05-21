import ApiError from '../core/errors/ApiError.js';

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (error) {
    const errorMessage = error.errors.map((details) => details.message).join(', ');
    next(new ApiError(400, errorMessage));
  }
};

export default validate;
