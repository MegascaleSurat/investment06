import watchlistRepository from './watchlist.repository.js';
import masterRepository from '../master/master.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';
import { db } from '../../db/index.js';
import { watchlistUploads } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

class WatchlistService {
  async getWatchlist(userId) {
    let watchlist = await watchlistRepository.findDefaultWatchlistByUserId(userId);
    if (!watchlist) {
      watchlist = await watchlistRepository.createWatchlist({
        userId,
        name: 'Default',
        isDefault: true
      });
    }
    const items = await watchlistRepository.getWatchlistItems(watchlist.id);
    const uploads = await watchlistRepository.getUploadsByUserId(userId);
    
    return { items, uploads };
  }

  async addStock(userId, data) {
    const { symbol, exchange, ...rest } = data;
    
    // 1. Find stock in master
    const stock = await masterRepository.findStockByCode(symbol, exchange);
    if (!stock) {
      throw new ApiError(404, `Stock ${symbol}:${exchange} not found in master list`);
    }

    // 2. Get default watchlist
    let watchlist = await watchlistRepository.findDefaultWatchlistByUserId(userId);
    if (!watchlist) {
      watchlist = await watchlistRepository.createWatchlist({
        userId,
        name: 'Default',
        isDefault: true
      });
    }

    // 3. Check if already in watchlist
    const existing = await watchlistRepository.findItemByStockAndWatchlist(stock.id, watchlist.id);
    if (existing) {
      throw new ApiError(400, 'Stock already in watchlist');
    }

    // 4. Add to watchlist
    const item = await watchlistRepository.addItem({
      watchlistId: watchlist.id,
      stockId: stock.id,
      ...rest
    });

    logger.info({ module: 'watchlist', action: 'addStock', userId, symbol }, 'Stock added to watchlist');
    
    // TODO: Trigger 20-day historical fetch job
    logger.info('Triggering 20-day historical fetch job (Mocked)');

    return item;
  }

  async updateStock(userId, stockCode, data) {
    let [symbol, exchange] = stockCode.split(':');
    exchange = exchange || 'NSE';

    const stock = await masterRepository.findStockByCode(symbol, exchange);
    if (!stock) throw new ApiError(404, 'Stock not found');

    const watchlist = await watchlistRepository.findDefaultWatchlistByUserId(userId);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found');

    const item = await watchlistRepository.findItemByStockAndWatchlist(stock.id, watchlist.id);
    if (!item) throw new ApiError(404, 'Stock not found in your watchlist');

    const updated = await watchlistRepository.updateItem(item.id, data);
    
    logger.info({ module: 'watchlist', action: 'updateStock', userId, symbol }, 'Watchlist item updated');
    return updated;
  }

  async removeStock(userId, stockCode) {
    let [symbol, exchange] = stockCode.split(':');
    exchange = exchange || 'NSE';

    const stock = await masterRepository.findStockByCode(symbol, exchange);
    if (!stock) throw new ApiError(404, 'Stock not found');

    const watchlist = await watchlistRepository.findDefaultWatchlistByUserId(userId);
    if (!watchlist) throw new ApiError(404, 'Watchlist not found');

    const item = await watchlistRepository.findItemByStockAndWatchlist(stock.id, watchlist.id);
    if (!item) throw new ApiError(404, 'Stock not found in your watchlist');

    // Restriction: Cannot remove if ACTIVE or ORDER_PLACED
    if (['ACTIVE', 'ORDER_PLACED'].includes(item.status)) {
      throw new ApiError(400, `Cannot remove stock in ${item.status} state`);
    }

    await watchlistRepository.deleteItem(item.id);
    logger.info({ module: 'watchlist', action: 'removeStock', userId, symbol }, 'Stock removed from watchlist');
  }

  async uploadWatchlist(userId, data) {
    const { filename, stocks: stocksToUpload } = data;

    const uploadRecord = await watchlistRepository.createUpload({
      userId,
      filename,
      status: 'PROCESSING',
      totalStocks: stocksToUpload.length
    });

    // In a production app, this would be a background job.
    // Here we process synchronously for the demo, but logic is ready for async.
    let processedCount = 0;
    const errors = [];

    for (const itemData of stocksToUpload) {
      try {
        await this.addStock(userId, itemData);
        processedCount++;
      } catch (err) {
        errors.push(`${itemData.symbol}: ${err.message}`);
      }
    }

    const finalStatus = errors.length === stocksToUpload.length ? 'FAILED' : 'COMPLETED';
    
    await db.update(watchlistUploads) // Accessing db directly for status update in service (acceptable for complex orchestration)
      .set({ 
        status: finalStatus,
        processedCount,
        errorLog: errors.join('\n')
      })
      .where(eq(watchlistUploads.id, uploadRecord.id));

    return { 
      uploadId: uploadRecord.id, 
      status: finalStatus, 
      processed: processedCount, 
      failed: errors.length 
    };
  }
}

export default new WatchlistService();
