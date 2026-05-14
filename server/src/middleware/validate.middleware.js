import ApiError from '../core/errors/ApiError.js';

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessage = error.errors.map((details) => details.message).join(', ');
    next(new ApiError(400, errorMessage));
  }
};

export default validate;
