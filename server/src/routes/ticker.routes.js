const express = require('express');
const tickerService = require('../services/ticker.service');
const { asyncHandler } = require('../core/asyncHandler');
const { authenticateJWT } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateJWT);

/**
 * @route POST /api/ticker/subscribe
 * @desc Subscribe to instrument tokens for live ticks
 */
router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const { tokens } = req.body;

    if (!Array.isArray(tokens)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. "tokens" must be an array of numbers.',
      });
    }

    // Convert to numbers to ensure type safety
    const numericTokens = tokens.map(Number).filter((t) => !isNaN(t));

    tickerService.subscribe(numericTokens);

    res.status(200).json({
      success: true,
      message: `Subscription request processed for ${numericTokens.length} tokens.`,
      subscribedCount: tickerService.subscribedTokens.size,
    });
  })
);

/**
 * @route POST /api/ticker/unsubscribe
 * @desc Unsubscribe from instrument tokens
 */
router.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const { tokens } = req.body;

    if (!Array.isArray(tokens)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. "tokens" must be an array of numbers.',
      });
    }

    const numericTokens = tokens.map(Number).filter((t) => !isNaN(t));

    tickerService.unsubscribe(numericTokens);

    res.status(200).json({
      success: true,
      message: `Unsubscription request processed for ${numericTokens.length} tokens.`,
      subscribedCount: tickerService.subscribedTokens.size,
    });
  })
);

module.exports = router;
