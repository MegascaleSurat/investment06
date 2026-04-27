const { NotFoundError } = require('../core/errors/httpErrors');

function notFound(_req, _res, next) {
  next(new NotFoundError('Route not found'));
}

module.exports = { notFound };

