import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(API_URL, {
  autoConnect: false,
  auth: (cb) => {
    cb({
      token: localStorage.getItem('zt_token'),
    });
  },
});

export default socket;
