const bcrypt = require('bcrypt');

const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError
} = require('../../../core/errors/httpErrors');
const { withTransaction } = require('../../../db/transaction');
const { signAccessToken } = require('../../../utils/jwt');

const repo = require('./user.repository');

const MAX_FAILED_ATTEMPTS = 5; // lock when attempts become > 5
const LOCK_MINUTES = 15;

function assertActiveUser(user) {
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (user.deleted_at) throw new UnauthorizedError('Account is deleted');
  if (user.status === 'DELETED') throw new UnauthorizedError('Account is deleted');
  if (user.status === 'SUSPENDED') throw new ForbiddenError('Account is suspended');
}

function isLocked(user) {
  if (!user?.locked_until) return false;
  return new Date(user.locked_until).getTime() > Date.now();
}

async function register({ full_name, email, phone, password }) {
  const password_hash = await bcrypt.hash(password, 12);

  const created = await withTransaction(async (client) => {
    const existingByEmail = await repo.findByEmail(email, client);
    if (existingByEmail && !existingByEmail.deleted_at) {
      throw new ConflictError('Email already registered');
    }

    if (phone) {
      const existingByPhone = await repo.findByPhone(phone, client);
      if (existingByPhone && !existingByPhone.deleted_at) {
        throw new ConflictError('Phone already registered');
      }
    }

    return repo.insertUser({ full_name, email, phone, password_hash }, client);
  });

  return repo.toSafeUser(created);
}

async function login({ email, password }) {
  return withTransaction(async (client) => {
    const user = await repo.findByEmail(email, client);
    assertActiveUser(user);

    if (isLocked(user)) {
      throw new ForbiddenError('Account is temporarily locked. Try again later.', {
        locked_until: user.locked_until
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const state = await repo.markLoginFailure(
        user.id,
        { maxAttempts: MAX_FAILED_ATTEMPTS, lockMinutes: LOCK_MINUTES },
        client
      );

      const locked = state?.locked_until && new Date(state.locked_until).getTime() > Date.now();
      if (locked) {
        throw new ForbiddenError('Too many failed attempts. Account locked for 15 minutes.', {
          locked_until: state.locked_until
        });
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    await repo.markLoginSuccess(user.id, client);

    const token = signAccessToken({
      sub: user.id,
      roles: user.role,
      email: user.email
    });

    return { token };
  });
}

async function getMe(userId) {
  const user = await repo.findById(userId);
  if (!user || user.deleted_at || user.status === 'DELETED') throw new NotFoundError('User not found');
  return user;
}

async function updateMe(userId, payload) {
  const phoneProvided = Object.prototype.hasOwnProperty.call(payload, 'phone');
  const fullNameProvided = Object.prototype.hasOwnProperty.call(payload, 'full_name');
  const { phone, full_name } = payload;

  return withTransaction(async (client) => {
    const existing = await repo.findById(userId, client);
    if (!existing || existing.deleted_at || existing.status === 'DELETED') {
      throw new NotFoundError('User not found');
    }

    if (phone) {
      const byPhone = await repo.findByPhone(phone, client);
      if (byPhone && byPhone.id !== userId && !byPhone.deleted_at) {
        throw new ConflictError('Phone already in use');
      }
    }

    const updated = await repo.updateProfile(
      userId,
      { full_name, phone, phoneProvided, fullNameProvided },
      client
    );
    return updated;
  });
}

async function changePassword(userId, { old_password, new_password }) {
  return withTransaction(async (client) => {
    const user = await repo.findById(userId, client);
    if (!user || user.deleted_at || user.status === 'DELETED') throw new NotFoundError('User not found');

    const fullUser = await repo.findByEmail(user.email, client);
    if (!fullUser) throw new NotFoundError('User not found');

    const ok = await bcrypt.compare(old_password, fullUser.password_hash);
    if (!ok) throw new BadRequestError('Old password is incorrect');

    const passwordHash = await bcrypt.hash(new_password, 12);
    await repo.updatePassword(userId, passwordHash, client);
    return true;
  });
}

async function adminListUsers({ page, limit, status, role }) {
  const offset = (page - 1) * limit;
  return repo.listUsers({ limit, offset, status, role });
}

async function adminUpdateUserStatus(userId, status) {
  const updated = await repo.updateUserStatus(userId, status);
  if (!updated) throw new NotFoundError('User not found');
  return updated;
}

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  adminListUsers,
  adminUpdateUserStatus
};
