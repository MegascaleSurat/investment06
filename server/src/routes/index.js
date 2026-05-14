import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import brokerRoutes from '../modules/broker/broker.route.js';
import masterRoutes from '../modules/master/master.route.js';
import watchlistRoutes from '../modules/watchlist/watchlist.route.js';
import dataRoutes from '../modules/data/data.route.js';
import metricsRoutes from '../modules/metrics/metrics.route.js';
import strategyRoutes from '../modules/strategy/strategy.route.js';
import tradeRoutes from '../modules/trade/trade.route.js';
import settingsRoutes from '../modules/settings/settings.route.js';
import analyticsRoutes from '../modules/analytics/analytics.route.js';
import maintenanceRoutes from '../modules/maintenance/maintenance.route.js';
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
router.use('/data', dataRoutes);
router.use('/metrics', metricsRoutes);
router.use('/strategies', strategyRoutes);
router.use('/trades', tradeRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/alerts', analyticsRoutes);
router.use('/logs', analyticsRoutes);

// Maintenance & Engine Control
router.use('/', maintenanceRoutes);

// Task asks for /api/orders specifically
router.use('/', tradeRoutes);

// Explicitly handle /tracked-stocks at the root level of /api
router.use('/', metricsRoutes);

export default router;
