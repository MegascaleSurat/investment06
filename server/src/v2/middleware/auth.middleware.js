const jwt = require('jsonwebtoken');

const { env } = require('../../config');
const { UnauthorizedError, ForbiddenError } = require('../../core/errors/httpErrors');

function authenticateJWT(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing bearer token'));

    const token = header.slice('Bearer '.length).trim();
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        next(new UnauthorizedError('Invalid or expired token'));
    }
}

function requireRole(role) {
    return (req, _res, next) => {
        const roles = req.user?.roles;
        const hasRole =
            roles === role ||
            (Array.isArray(roles) && roles.includes(role)) ||
            (typeof roles === 'string' && roles.split(',').includes(role));

        if (!hasRole) return next(new ForbiddenError('Insufficient permissions'));
        next();
    };
}

module.exports = { authenticateJWT, requireRole };

