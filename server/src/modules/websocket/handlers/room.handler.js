import logger from '../../../config/logger.js';
import { SOCKET_ROOMS } from '../constants/events.js';

/**
 * Room event handlers
 */
export default (io, socket) => {
  /**
   * Join a specific room (user, strategy, portfolio)
   */
  const joinRoom = (roomType, id) => {
    try {
      let roomName;
      
      switch (roomType) {
        case 'user':
          // Security: Users can only join their own room
          if (id !== socket.user.id) {
            logger.warn({ socketId: socket.id, userId: socket.user.id, targetId: id }, 'Unauthorized attempt to join user room');
            return socket.emit('error', { message: 'Unauthorized room access' });
          }
          roomName = SOCKET_ROOMS.USER(id);
          break;
          
        case 'strategy':
          // Future: Check if user has access to this strategy
          roomName = SOCKET_ROOMS.STRATEGY(id);
          break;
          
        case 'portfolio':
          // Future: Check if user has access to this portfolio
          roomName = SOCKET_ROOMS.PORTFOLIO(id);
          break;

        case 'market':
          roomName = SOCKET_ROOMS.MARKET;
          break;
          
        default:
          return socket.emit('error', { message: 'Invalid room type' });
      }

      socket.join(roomName);
      logger.info({ socketId: socket.id, userId: socket.user.id, roomName }, 'Socket joined room');
      
      socket.emit('room:joined', { room: roomName });
    } catch (error) {
      logger.error({ socketId: socket.id, error: error.message }, 'Failed to join room');
      socket.emit('error', { message: 'Failed to join room' });
    }
  };

  /**
   * Leave a specific room
   */
  const leaveRoom = (roomName) => {
    socket.leave(roomName);
    logger.info({ socketId: socket.id, userId: socket.user.id, roomName }, 'Socket left room');
    socket.emit('room:left', { room: roomName });
  };

  // Bind events
  socket.on('room:join', joinRoom);
  socket.on('room:leave', leaveRoom);
};
