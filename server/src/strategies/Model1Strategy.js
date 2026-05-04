/**
 * @implements {IStrategy}
 */
class Model1Strategy {
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
    if (stock.volumeRatio < 1.5) {
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
   * @returns {Object}
   */
  managePosition(stock) {
    return stock; // No trailing logic in Model 1
  }
}

export default Model1Strategy;
