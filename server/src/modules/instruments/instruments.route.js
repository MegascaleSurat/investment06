import express from 'express';
import instrumentsController from './instruments.controller.js';
import { getQuoteSchema, getHistoricalSchema } from './instruments.validation.js';
import validate from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/instruments', instrumentsController.syncInstruments);
router.get('/quote/:instruments', validate(getQuoteSchema), instrumentsController.getQuote);
router.get('/ltp/:instruments', validate(getQuoteSchema), instrumentsController.getLTP);
router.get('/ohlc/:instruments', validate(getQuoteSchema), instrumentsController.getOHLC);
router.get('/historical/:instrument_token', validate(getHistoricalSchema), instrumentsController.getHistorical);

export default router;
