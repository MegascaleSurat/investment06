const { BadRequestError } = require('../core/errors/httpErrors');

function validate(schema, property = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[property]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }));
      return next(new BadRequestError('Validation failed', details));
    }

    req[property] = parsed.data;
    next();
  };
}

module.exports = { validate };

