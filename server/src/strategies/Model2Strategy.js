import { calcPnlPct } from '../utils/finance.js';

/**
 * @implements {IStrategy}
 */
class Model2Strategy {
  constructor(config = {}) {
    this.config = config;
  }

  initialize(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * @param {StockSnapshot} stock
   * @param {MarketSnapshot} market
   * @returns {EntryDecision}
   */
  evaluateEntry(stock, market) {
    if (stock.hasActivePosition) {
      return { action: 'BLOCK', reason: 'ALREADY_ACTIVE' };
    }
    if (stock.ltp <= stock.entryPrice) {
      return { action: 'BLOCK', reason: 'PRICE_BELOW_ENTRY' };
    }
    if (stock.volumeRatio < 1.2) {
      return { action: 'BLOCK', reason: 'LOW_VOLUME_RATIO' };
    }
    if (stock.sectorStatus !== 'STRONG') {
      return { action: 'BLOCK', reason: 'WEAK_SECTOR' };
    }
    if (market.marketStatus === 'WEAK') {
      return { action: 'BLOCK', reason: 'WEAK_MARKET' };
    }

    return { action: 'BUY', reason: 'SOP_CRITERIA_MET' };
  }

  /**
   * @param {StockSnapshot} stock
   * @param {MarketSnapshot} market
   * @returns {ExitDecision}
   */
  evaluateExit(stock, market) {
    if (stock.ltp <= stock.stopLoss) {
      return { action: 'EXIT', reason: 'SL_HIT' };
    }
    if (stock.holdingDays >= 7 && Math.abs(stock.pnlPct) <= 2) {
      return { action: 'EXIT', reason: 'INACTIVITY' };
    }
    if (stock.volumeWeakDays >= 2) {
      return { action: 'EXIT', reason: 'VOLUME_WEAKNESS' };
    }

    return { action: 'HOLD', reason: 'STAY_IN_TRADE' };
  }

  /**
   * @param {StockSnapshot} stock
   * @returns {ExitDecision}
   */
  managePosition(stock) {
    const pnlPct = calcPnlPct(stock.ltp, stock.entryPrice);

    // Initial Trail to Cost
    if (pnlPct >= 5 && stock.stopLoss < stock.entryPrice) {
      return { action: 'TRAIL_SL', newSl: stock.entryPrice, reason: 'NO_LOSS_LOCK' };
    }

    // Incremental Trailing
    if (pnlPct > 0) {
      const stepPercent = stock.stepPercent || 3;
      const currentTrailPct = calcPnlPct(stock.stopLoss, stock.entryPrice);
      
      // If we are up by another step since last trail
      if (pnlPct >= currentTrailPct + stepPercent) {
        const trailedSl = stock.stopLoss * (1 + (stepPercent / 100));
        return { action: 'TRAIL_SL', newSl: trailedSl, reason: 'STEP_TRAIL' };
      }
    }

    return { action: 'HOLD' };
  }
}

export default Model2Strategy;
