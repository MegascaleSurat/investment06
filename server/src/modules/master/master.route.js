import { Router } from 'express';
import masterController from './master.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  createSectorSchema, 
  updateSectorSchema, 
  createStockSchema, 
  updateStockSchema,
  bulkImportStocksSchema
} from './master.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// Publicly readable or just admin? Task doesn't specify. 
// Usually master data is readable by all, writable by admin.
// For now, protecting all as requested in "REQUIRED IMPLEMENTATION"

router.use(protect);

// Sectors
router.get('/sectors', masterController.getSectors);
router.post('/sectors', validate(createSectorSchema), masterController.createSector);
router.put('/sectors/:sector_id', validate(updateSectorSchema), masterController.updateSector);

// Stocks
router.get('/stocks', masterController.getStocks);
router.post('/stocks', validate(createStockSchema), masterController.createStock);
router.put('/stocks/:stock_code', validate(updateStockSchema), masterController.updateStock);
router.post('/stocks/bulk-import', validate(bulkImportStocksSchema), masterController.bulkImportStocks);

export default router;
