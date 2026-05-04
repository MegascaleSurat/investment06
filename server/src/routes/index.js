import { Router } from 'express';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Placeholder routes - to be implemented with actual route files
router.use('/api/v1/auth', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.use('/api/v1/watchlist', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.use('/api/v1/sectors', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.use('/api/v1/trades', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.use('/api/v1/positions', (req, res) => res.status(501).json({ error: 'Not implemented' }));

export default router;
