import ApiError from '../core/errors/ApiError.js';

const validate = (schema) => (req, res, next) => {
  try {
    // If schema has body, query, or params keys, validate them specifically
    if (schema.body || schema.query || schema.params) {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
    } else {
      // Otherwise assume the schema is for the body
      req.body = schema.parse(req.body);
    }
    next();
  } catch (error) {
    const errorMessage = error.errors ? error.errors.map((details) => details.message).join(', ') : error.message;
    next(new ApiError(400, errorMessage));
  }
};

export default validate;
