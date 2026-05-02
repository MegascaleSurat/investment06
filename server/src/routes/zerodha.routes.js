const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/zerodha.controller');
const { authenticateJWT } = require('../middlewares/auth');

// Fetch Zerodha profile - Protected by JWT auth
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;
