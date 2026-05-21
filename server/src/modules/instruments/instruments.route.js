import { Router } from 'express';
import instrumentsController from './instruments.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  downloadInstrumentsSchema,
  quoteQuerySchema,
  ltpQuerySchema,
  ohlcQuerySchema,
  historicalQuerySchema,
} from './instruments.validation.js';

const router = Router();

router.get(
  '/instruments',
  validate(downloadInstrumentsSchema, 'query'),
  instrumentsController.downloadInstruments
);

router.get(
  '/quote',
  validate(quoteQuerySchema, 'query'),
  instrumentsController.getQuote
);

router.get(
  '/ltp',
  validate(ltpQuerySchema, 'query'),
  instrumentsController.getLtp
);

router.get(
  '/ohlc',
  validate(ohlcQuerySchema, 'query'),
  instrumentsController.getOhlc
);

router.get(
  '/historical/:instrumentToken',
  validate(historicalQuerySchema, 'query'),
  instrumentsController.getHistorical
);

export default router;
