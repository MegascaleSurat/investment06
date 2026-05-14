/**
 * Example frontend implementation using socket.io-client
 */

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000/ws'; // Note the /ws namespace

const initSocket = (token) => {
  const socket = io(SOCKET_URL, {
    auth: {
      token: token // JWT Token
    },
    transports: ['websocket'], // Prefer websockets
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Lifecycle events
  socket.on('connect', () => {
    console.log('✅ Connected to realtime server');
    
    // Join strategy room
    socket.emit('room:join', 'strategy', '738561-id');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error.message);
  });

  // Room events
  socket.on('room:joined', ({ room }) => {
    console.log('🏠 Joined room:', room);
  });

  // Business events
  socket.on('trade:updated', (data) => {
    console.log('📈 Trade Update:', data);
  });

  socket.on('order:executed', (data) => {
    console.log('🎯 Order Executed:', data);
  });

  socket.on('pnl:updated', (data) => {
    console.log('💰 PnL Update:', data);
  });

  socket.on('system:notification', (data) => {
    alert(`${data.title}: ${data.message}`);
  });

  return socket;
};

export default initSocket;
