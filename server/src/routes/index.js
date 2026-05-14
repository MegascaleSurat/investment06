import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import brokerRoutes from '../modules/broker/broker.route.js';
import masterRoutes from '../modules/master/master.route.js';
import watchlistRoutes from '../modules/watchlist/watchlist.route.js';
import ApiResponse from '../core/response/ApiResponse.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json(ApiResponse.success({
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'UP'
  }, 'System is healthy'));
});

// Module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/broker', brokerRoutes);
router.use('/master', masterRoutes);
router.use('/watchlist', watchlistRoutes);

export default router;
