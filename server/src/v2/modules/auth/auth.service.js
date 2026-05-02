const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const logger = require("../../utils/logger");

const {
    findUserByEmail,
    updateFailedAttempts,
    resetLoginAttempts,
} = require("./auth.repository");

const {
    UnauthorizedError,
    ForbiddenError,
} = require("../../../core/errors/httpErrors");

const MAX_ATTEMPTS = 5;

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id },
        env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken };
};

const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new UnauthorizedError("Invalid credentials");
    }

    if (user.status !== "ACTIVE" || user.deleted_at) {
        throw new ForbiddenError("Account not active");
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new ForbiddenError("Account locked. Try later.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        await updateFailedAttempts(user.id, MAX_ATTEMPTS);
        throw new UnauthorizedError("Invalid credentials");
    }

    await resetLoginAttempts(user.id);

    const tokens = generateTokens(user);

    logger.info({ userId: user.id }, "User logged in");

    return tokens;
};

module.exports = {
    loginUser,
};