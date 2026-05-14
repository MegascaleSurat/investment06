import { Router } from 'express';
import watchlistController from './watchlist.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  addStockSchema, 
  updateStockSchema, 
  uploadWatchlistSchema 
} from './watchlist.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', watchlistController.getWatchlist);
router.post('/upload', validate(uploadWatchlistSchema), watchlistController.uploadWatchlist);
router.post('/add', validate(addStockSchema), watchlistController.addStock);
router.put('/:stock_code', validate(updateStockSchema), watchlistController.updateStock);
router.delete('/:stock_code', watchlistController.removeStock);

export default router;
