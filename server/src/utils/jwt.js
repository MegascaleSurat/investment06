const jwt = require('jsonwebtoken');

const { env } = require('../config');

function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, ...opts });
}

module.exports = { signAccessToken };

