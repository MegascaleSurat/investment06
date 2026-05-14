import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './auth.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';
import { db } from '../../db/index.js';

class AuthService {
  async register(userData) {
    const { email, password, fullName, phone, role } = userData;

    // Check if email already exists
    const existingUserByEmail = await authRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Check if phone already exists if provided
    if (phone) {
      const existingUserByPhone = await authRepository.findByPhone(phone);
      if (existingUserByPhone) {
        throw new ApiError(400, 'User with this phone number already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction for user creation and default settings
    const result = await db.transaction(async (tx) => {
      const user = await authRepository.create({
        email,
        fullName,
        phone,
        role: role || 'USER',
        passwordHash: hashedPassword,
      });

      // Create default settings
      await authRepository.createSettings([
        {
          userId: user.id,
          key: 'theme',
          value: { mode: 'dark' },
          scope: 'USER',
        },
        {
          userId: user.id,
          key: 'notifications',
          value: { email: true, push: true },
          scope: 'USER',
        },
        {
          userId: user.id,
          key: 'trading_defaults',
          value: { defaultExchange: 'NSE', defaultProduct: 'MIS' },
          scope: 'USER',
        }
      ]);

      return user;
    });

    const { accessToken, refreshToken } = this.generateTokens(result);
    await authRepository.updateRefreshToken(result.id, refreshToken);

    logger.info({
      module: 'auth',
      action: 'register',
      userId: result.id,
      email: result.email,
      status: 'success'
    }, 'User registered successfully');

    return { user: this.excludePassword(result), accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      logger.warn({
        module: 'auth',
        action: 'login',
        email,
        status: 'failed',
        reason: 'Invalid email or password'
      }, 'Login failed');
      throw new ApiError(401, 'Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    await authRepository.updateRefreshToken(user.id, refreshToken);

    logger.info({
      module: 'auth',
      action: 'login',
      userId: user.id,
      email: user.email,
      status: 'success'
    }, 'Login successful');

    return { user: this.excludePassword(user), accessToken, refreshToken };
  }

  async logout(userId) {
    await authRepository.clearRefreshToken(userId);
  }

  async refresh(oldRefreshToken) {
    try {
      const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
      const user = await authRepository.findById(decoded.id);

      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const { accessToken, refreshToken } = this.generateTokens(user);
      await authRepository.updateRefreshToken(user.id, refreshToken);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async getProfile(userId) {
    const user = await authRepository.getUserWithSettings(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return this.excludePassword(user);
  }

  async updateProfile(userId, updateData) {
    const user = await authRepository.update(userId, updateData);
    logger.info({
      module: 'auth',
      action: 'updateProfile',
      userId,
      status: 'success'
    }, 'User profile updated');
    return this.excludePassword(user);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await authRepository.findById(userId);
    if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
      throw new ApiError(400, 'Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(userId, hashedPassword);

    logger.info({
      module: 'auth',
      action: 'changePassword',
      userId,
      status: 'success'
    }, 'User password changed');
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  excludePassword(user) {
    const { password, passwordHash, refreshToken, ...rest } = user;
    return rest;
  }
}

export default new AuthService();
