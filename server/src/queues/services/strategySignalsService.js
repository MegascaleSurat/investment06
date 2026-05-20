import { db } from '../../db/index.js';
import { 
  stocks, 
  watchlistItems, 
  watchlists, 
  stockMetrics, 
  sectorMetrics, 
  marketMetrics, 
  marketDataLive, 
  marketDataIntraday,
  confirmationTimers,
  signals,
  entrySignals,
  strategies
} from '../../db/schema/index.js';
import { eq, and, lte, gte, desc, sql } from 'drizzle-orm';
import logger from '../../config/logger.js';

class StrategySignalsService {
  /**
   * 1. runTrackedStockEngine
   * Evaluates active tracked stocks against entry criteria.
   * If matched, starts a 5-minute confirmation timer.
   */
  async runTrackedStockEngine() {
    logger.info('[StrategySignalsService] Starting runTrackedStockEngine...');
    try {
      // Fetch latest global market status
      const latestMarket = await db.select()
        .from(marketMetrics)
        .orderBy(desc(marketMetrics.updatedAt))
        .limit(1);
      
      const marketStatus = latestMarket.length > 0 ? latestMarket[0].marketStatus : 'NEUTRAL';
      if (marketStatus === 'WEAK') {
        logger.info('[StrategySignalsService] Market status is WEAK. Skipping normal entry checks.');
        return { success: true, processed: 0 };
      }

      // Query active watchlist items that are in 'TRACKING' status
      const candidates = await db.select({
        watchlistId: watchlistItems.watchlistId,
        watchlistItemId: watchlistItems.id,
        stockId: stocks.id,
        symbol: stocks.symbol,
        userId: watchlists.userId,
        entryPrice: watchlistItems.entryPrice,
        volumeRatio: stockMetrics.volumeRatio,
        sectorStatus: sectorMetrics.sectorStatus,
        ltp: marketDataLive.ltp
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .innerJoin(stocks, eq(watchlistItems.stockId, stocks.id))
      .innerJoin(stockMetrics, eq(stocks.id, stockMetrics.stockId))
      .leftJoin(sectorMetrics, eq(stocks.sectorId, sectorMetrics.sectorId))
      .innerJoin(marketDataLive, eq(stocks.id, marketDataLive.stockId))
      .where(
        and(
          eq(watchlistItems.status, 'TRACKING'),
          eq(watchlists.status, 'ACTIVE'),
          eq(stocks.isActive, true),
          eq(stocks.isTracked, true)
        )
      );

      let processedCount = 0;
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      for (const candidate of candidates) {
        const ltp = parseFloat(candidate.ltp) || 0.0;
        const entryPrice = parseFloat(candidate.entryPrice) || 0.0;
        const volumeRatio = parseFloat(candidate.volumeRatio) || 0.0;
        const isSectorStrong = candidate.sectorStatus === 'STRONG';

        // Core breakout rules: price > entry, volume ratio >= 1.2, sector is STRONG
        if (ltp > entryPrice && volumeRatio >= 1.2 && isSectorStrong) {
          
          // Ensure no duplicate ACTIVE timer exists
          const activeTimer = await db.select({ id: confirmationTimers.id })
            .from(confirmationTimers)
            .where(
              and(
                eq(confirmationTimers.stockId, candidate.stockId),
                eq(confirmationTimers.timerStatus, 'ACTIVE')
              )
            )
            .limit(1);

          if (activeTimer.length > 0) {
            continue;
          }

          const now = new Date();
          const timerExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes window

          // Start 5-minute confirmation timer
          await db.insert(confirmationTimers).values({
            stockId: candidate.stockId,
            userId: candidate.userId,
            timerStartedAt: now,
            timerExpiresAt,
            timerStatus: 'ACTIVE',
            entryPriceAtStart: candidate.entryPrice
          });

          // Transition watchlist item status to WAITING_CONFIRMATION
          await db.update(watchlistItems)
            .set({ status: 'WAITING_CONFIRMATION', updatedAt: new Date() })
            .where(eq(watchlistItems.id, candidate.watchlistItemId));

          // Broadcast state changes
          eventBus.emit(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, {
            stockId: candidate.stockId,
            symbol: candidate.symbol,
            userId: candidate.userId,
            status: 'WAITING_CONFIRMATION',
            timerExpiresAt
          });

          logger.info({ symbol: candidate.symbol, entryPrice }, '⏱️ Started 5-min Confirmation Timer');
          processedCount++;
        }
      }

      logger.info({ processedCount }, '[StrategySignalsService] Completed runTrackedStockEngine');
      return { success: true, processed: processedCount };
    } catch (error) {
      logger.error('❌ [StrategySignalsService] Error in runTrackedStockEngine:', error);
      throw error;
    }
  }

  /**
   * 2. monitorConfirmationTimers
   * Evaluates ACTIVE timers that have crossed their expiry limit.
   * If price remained above entry -> CONFIRMS and fires BUY signal.
   * If failed -> resets status to TRACKING.
   */
  async monitorConfirmationTimers() {
    logger.info('[StrategySignalsService] Checking confirmation timers...');
    try {
      const now = new Date();
      const strategyId = await this._getOrCreateStrategy();

      // Find all ACTIVE confirmation timers that are expired
      const activeTimers = await db.select({
        id: confirmationTimers.id,
        stockId: confirmationTimers.stockId,
        userId: confirmationTimers.userId,
        timerStartedAt: confirmationTimers.timerStartedAt,
        timerExpiresAt: confirmationTimers.timerExpiresAt,
        entryPriceAtStart: confirmationTimers.entryPriceAtStart,
        symbol: stocks.symbol
      })
      .from(confirmationTimers)
      .innerJoin(stocks, eq(confirmationTimers.stockId, stocks.id))
      .where(
        and(
          eq(confirmationTimers.timerStatus, 'ACTIVE'),
          lte(confirmationTimers.timerExpiresAt, now)
        )
      );

      let activatedSignals = 0;
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      for (const timer of activeTimers) {
        // Query to check if the price breached/dropped below entry price during the 5-min window
        const breaches = await db.select()
          .from(marketDataIntraday)
          .where(
            and(
              eq(marketDataIntraday.stockId, timer.stockId),
              gte(marketDataIntraday.candleTime, timer.timerStartedAt),
              lte(marketDataIntraday.candleTime, timer.timerExpiresAt),
              sql`${marketDataIntraday.low} < ${timer.entryPriceAtStart}`
            )
          );

        // Fetch latest live price
        const [liveQuote] = await db.select({ ltp: marketDataLive.ltp })
          .from(marketDataLive)
          .where(eq(marketDataLive.stockId, timer.stockId))
          .limit(1);

        const currentLtp = liveQuote ? parseFloat(liveQuote.ltp) : 0.0;
        const entryPrice = parseFloat(timer.entryPriceAtStart) || 0.0;

        const hasRemainedAbove = breaches.length === 0 && currentLtp >= entryPrice;

        if (hasRemainedAbove) {
          // Success Path: Confirm & Fire BUY Signal
          logger.info({ symbol: timer.symbol }, '🔥 Confirmation Timer Success! Price sustained. Generating BUY signal.');

          await db.transaction(async (tx) => {
            // Update timer state
            await tx.update(confirmationTimers)
              .set({ timerStatus: 'TRIGGERED', updatedAt: new Date() })
              .where(eq(confirmationTimers.id, timer.id));

            // Update watchlist status
            await tx.update(watchlistItems)
              .set({ status: 'READY', updatedAt: new Date() })
              .where(
                and(
                  eq(watchlistItems.stockId, timer.stockId),
                  eq(watchlistItems.status, 'WAITING_CONFIRMATION')
                )
              );

            // Insert into signals table
            const [newSignal] = await tx.insert(signals).values({
              strategyId,
              stockId: timer.stockId,
              signalType: 'ENTRY',
              direction: 'BUY',
              price: String(currentLtp),
              confidence: '0.85',
              signalScore: '85.00',
              status: 'TRIGGERED',
              signalStatus: 'READY',
              triggeredAt: new Date()
            }).returning();

            // Insert details into entry_signals table
            await tx.insert(entrySignals).values({
              signalId: newSignal.id,
              strategyId,
              stockId: timer.stockId,
              direction: 'BUY',
              entryPrice: timer.entryPriceAtStart,
              status: 'CONFIRMED',
              signalStatus: 'READY',
              signalScore: '85.00',
              confirmedAt: new Date()
            });

            // Emit trade signal and update events
            eventBus.emit(INTERNAL_EVENTS.TRADE_SIGNAL_GENERATED, {
              signalId: newSignal.id,
              stockId: timer.stockId,
              symbol: timer.symbol,
              userId: timer.userId,
              direction: 'BUY',
              price: currentLtp,
              timestamp: new Date()
            });

            eventBus.emit(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, {
              stockId: timer.stockId,
              symbol: timer.symbol,
              userId: timer.userId,
              status: 'READY'
            });
          });

          activatedSignals++;
        } else {
          // Failure Path: Cancel and reset watchlist status back to TRACKING
          logger.info({ symbol: timer.symbol, currentLtp, entryPrice, breachesCount: breaches.length }, '❌ Confirmation Timer Failed. Resetting back to TRACKING.');

          await db.transaction(async (tx) => {
            await tx.update(confirmationTimers)
              .set({ 
                timerStatus: 'CANCELLED', 
                cancelledAt: new Date(), 
                cancelReason: 'Price breached or live price dropped below entry threshold.',
                updatedAt: new Date() 
              })
              .where(eq(confirmationTimers.id, timer.id));

            await tx.update(watchlistItems)
              .set({ status: 'TRACKING', updatedAt: new Date() })
              .where(
                and(
                  eq(watchlistItems.stockId, timer.stockId),
                  eq(watchlistItems.status, 'WAITING_CONFIRMATION')
                )
              );

            eventBus.emit(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, {
              stockId: timer.stockId,
              symbol: timer.symbol,
              userId: timer.userId,
              status: 'TRACKING'
            });
          });
        }
      }

      logger.info({ activatedSignals }, '[StrategySignalsService] Completed monitorConfirmationTimers');
      return { success: true, activated: activatedSignals };
    } catch (error) {
      logger.error('❌ [StrategySignalsService] Error in monitorConfirmationTimers:', error);
      throw error;
    }
  }

  /**
   * 3. runWeakMarketException
   * Evaluates tracked stocks for outperformance during WEAK market conditions.
   */
  async runWeakMarketException() {
    logger.info('[StrategySignalsService] Starting runWeakMarketException evaluation...');
    try {
      const latestMarket = await db.select()
        .from(marketMetrics)
        .orderBy(desc(marketMetrics.updatedAt))
        .limit(1);

      const marketStatus = latestMarket.length > 0 ? latestMarket[0].marketStatus : 'NEUTRAL';
      if (marketStatus !== 'WEAK') {
        logger.info('[StrategySignalsService] Market is not WEAK. Skipping weak exception checks.');
        return { success: true, count: 0 };
      }

      const strategyId = await this._getOrCreateStrategy();

      // Fetch candidates with sector metrics & live data
      const candidates = await db.select({
        watchlistId: watchlistItems.watchlistId,
        watchlistItemId: watchlistItems.id,
        stockId: stocks.id,
        symbol: stocks.symbol,
        userId: watchlists.userId,
        entryPrice: watchlistItems.entryPrice,
        volumeRatio: stockMetrics.volumeRatio,
        sectorStatus: sectorMetrics.sectorStatus,
        sectorOutperformance: sectorMetrics.outperformancePct,
        sectorBreadth: sectorMetrics.breadthPct,
        ltp: marketDataLive.ltp
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .innerJoin(stocks, eq(watchlistItems.stockId, stocks.id))
      .innerJoin(stockMetrics, eq(stocks.id, stockMetrics.stockId))
      .innerJoin(sectorMetrics, eq(stocks.sectorId, sectorMetrics.sectorId))
      .innerJoin(marketDataLive, eq(stocks.id, marketDataLive.stockId))
      .where(
        and(
          eq(watchlistItems.status, 'TRACKING'),
          eq(watchlists.status, 'ACTIVE'),
          eq(stocks.isActive, true),
          eq(stocks.isTracked, true)
        )
      );

      let exceptionCount = 0;
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      for (const candidate of candidates) {
        const outperformance = parseFloat(candidate.sectorOutperformance) || 0.0;
        const breadth = parseFloat(candidate.sectorBreadth) || 0.0;
        const volRatio = parseFloat(candidate.volumeRatio) || 0.0;
        const ltp = parseFloat(candidate.ltp) || 0.0;
        const entryPrice = parseFloat(candidate.entryPrice) || 0.0;

        // Weak market rules: sector outperformance >= 1.0%, sector breadth >= 60%, stock volume ratio >= 1.5
        if (outperformance >= 1.0 && breadth >= 60.0 && volRatio >= 1.5 && ltp > entryPrice) {
          
          logger.info({ symbol: candidate.symbol }, '💎 Weak Market Exception Met! Generating 50% Alloc BUY Signal.');

          await db.transaction(async (tx) => {
            // Update watchlist item status directly to READY (no confirmation timer needed for exceptions)
            await tx.update(watchlistItems)
              .set({ status: 'READY', updatedAt: new Date() })
              .where(eq(watchlistItems.id, candidate.watchlistItemId));

            // Generate signal
            const [signal] = await tx.insert(signals).values({
              strategyId,
              stockId: candidate.stockId,
              signalType: 'ENTRY',
              direction: 'BUY',
              price: String(ltp),
              confidence: '0.90',
              signalScore: '90.00',
              status: 'TRIGGERED',
              signalStatus: 'READY',
              metadata: { weakMarketException: true, allocationModifier: 0.5 },
              triggeredAt: new Date()
            }).returning();

            // Insert entry details
            await tx.insert(entrySignals).values({
              signalId: signal.id,
              strategyId,
              stockId: candidate.stockId,
              direction: 'BUY',
              entryPrice: candidate.entryPrice,
              status: 'CONFIRMED',
              signalStatus: 'READY',
              signalScore: '90.00',
              metadata: { weakMarketException: true, allocationModifier: 0.5 },
              confirmedAt: new Date()
            });

            // Emit trade signal generated
            eventBus.emit(INTERNAL_EVENTS.TRADE_SIGNAL_GENERATED, {
              signalId: signal.id,
              stockId: candidate.stockId,
              symbol: candidate.symbol,
              userId: candidate.userId,
              direction: 'BUY',
              price: ltp,
              metadata: { weakMarketException: true, allocationModifier: 0.5 },
              timestamp: new Date()
            });

            eventBus.emit(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, {
              stockId: candidate.stockId,
              symbol: candidate.symbol,
              userId: candidate.userId,
              status: 'READY'
            });
          });

          exceptionCount++;
        }
      }

      logger.info({ exceptionCount }, '[StrategySignalsService] Completed runWeakMarketException');
      return { success: true, processed: exceptionCount };
    } catch (error) {
      logger.error('❌ [StrategySignalsService] Error in runWeakMarketException:', error);
      throw error;
    }
  }

  /**
   * 4. evaluateSignalQuality
   * Evaluates latest signal scores using slot, day cumulative ratios, breakouts, and liquidity.
   */
  async evaluateSignalQuality() {
    logger.info('[StrategySignalsService] Running evaluateSignalQuality score computations...');
    try {
      // Retrieve Nifty 50 or today's active signals
      const activeSignals = await db.select({
        id: signals.id,
        stockId: signals.stockId,
        symbol: stocks.symbol,
        volumeRatio: stockMetrics.volumeRatio,
        priceChangePct: stockMetrics.priceChangePct,
        avgVolume: stockMetrics.avg10dVolume
      })
      .from(signals)
      .innerJoin(stocks, eq(signals.stockId, stocks.id))
      .innerJoin(stockMetrics, eq(stocks.id, stockMetrics.stockId))
      .where(
        and(
          eq(signals.status, 'TRIGGERED'),
          gte(signals.createdAt, sql`CURRENT_DATE`)
        )
      );

      let evaluatedCount = 0;

      for (const signal of activeSignals) {
        const volumeRatio = parseFloat(signal.volumeRatio) || 0.0;
        const priceChangePct = parseFloat(signal.priceChangePct) || 0.0;
        const avgVolume = parseFloat(signal.avgVolume) || 0.0;

        // 1. Slot volume ratio points (max 40pts)
        const slotPoints = Math.min(volumeRatio / 3.0, 1.0) * 40;

        // 2. Cumulative volume ratio points (max 30pts)
        const cumPoints = Math.min(volumeRatio / 3.0, 1.0) * 30;

        // 3. Breakout strength confirmation (max 20pts)
        const breakoutPoints = priceChangePct >= 2.0 ? 20.0 : Math.max(0.0, (priceChangePct / 2.0) * 20.0);

        // 4. Liquidity index scoring (max 10pts)
        const liquidityPoints = avgVolume >= 500000 ? 10.0 : Math.max(0.0, (avgVolume / 500000.0) * 10.0);

        const calculatedScore = Math.round(slotPoints + cumPoints + breakoutPoints + liquidityPoints);

        // Classify Status
        let qualityStatus = 'REJECT';
        if (calculatedScore >= 80) {
          qualityStatus = 'STRONG';
        } else if (calculatedScore >= 50) {
          qualityStatus = 'ACCEPTABLE';
        }

        // Update tables
        await db.update(signals)
          .set({
            signalScore: String(calculatedScore),
            signalStatus: qualityStatus,
            slotRatio: String(volumeRatio),
            cumulativeRatio: String(volumeRatio)
          })
          .where(eq(signals.id, signal.id));

        await db.update(entrySignals)
          .set({
            signalScore: String(calculatedScore),
            signalStatus: qualityStatus,
            slotRatio: String(volumeRatio),
            cumulativeRatio: String(volumeRatio)
          })
          .where(eq(entrySignals.signalId, signal.id));

        logger.info({ symbol: signal.symbol, calculatedScore, qualityStatus }, '📊 Calculated Signal Quality Score');
        evaluatedCount++;
      }

      logger.info({ evaluatedCount }, '[StrategySignalsService] Completed evaluateSignalQuality');
      return { success: true, evaluated: evaluatedCount };
    } catch (error) {
      logger.error('❌ [StrategySignalsService] Error in evaluateSignalQuality:', error);
      throw error;
    }
  }

  /**
   * Helper: Retrieve or insert default Breakout strategy record
   */
  async _getOrCreateStrategy() {
    const strategyName = 'Zero-Thinking Breakout';
    const strat = await db.select().from(strategies).where(eq(strategies.name, strategyName)).limit(1);
    if (strat.length > 0) {
      return strat[0].id;
    }

    const [newStrat] = await db.insert(strategies).values({
      name: strategyName,
      description: 'Core breakout strategy checking volume ratios and sector strength.',
      isActive: true
    }).returning();

    return newStrat.id;
  }
}

export default new StrategySignalsService();
