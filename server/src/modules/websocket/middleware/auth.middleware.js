import jwt from 'jsonwebtoken';
import config from '../../../config/index.js';
import logger from '../../../config/logger.js';
import { db } from '../../../db/index.js';
import { users } from '../../../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT from handshake auth/query and attaches user to socket
 */
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: User not found');
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    logger.info({ socketId: socket.id, userId: user.id }, 'Socket authenticated successfully');
    next();
  } catch (error) {
    logger.error({ socketId: socket.id, error: error.message }, 'Socket authentication failed');
    next(new Error('Authentication error: Invalid token'));
  }
};
