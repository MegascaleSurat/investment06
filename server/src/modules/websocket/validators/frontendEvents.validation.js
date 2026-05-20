import { z } from 'zod';

/**
 * Zod Schemas for frontend event payloads to ensure strict validation
 */

// 1. market:status
export const marketStatusSchema = z.object({
  status: z.enum(['STRONG', 'NEUTRAL', 'WEAK']),
  timestamp: z.coerce.date().default(() => new Date())
});

// 2. sector:metrics:update
export const sectorMetricsUpdateSchema = z.object({
  sectors: z.array(
    z.object({
      name: z.string(),
      rank: z.number().int(),
      score: z.number().nullable().optional(),
      status: z.string().nullable().optional()
    })
  ),
  timestamp: z.coerce.date().default(() => new Date())
});

// 3. stock:ltp
export const stockLtpSchema = z.object({
  stockCode: z.string(),
  ltp: z.number().positive(),
  volumeRatio: z.number().nonnegative(),
  priceChangePct: z.number(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 4. stock:entry_status
export const stockEntryStatusSchema = z.object({
  stockCode: z.string(),
  status: z.enum(['WAITING', 'BLOCKED', 'READY']),
  reason: z.string().nullable().optional(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 5. stock:confirmation_timer
export const stockConfirmationTimerSchema = z.object({
  stockCode: z.string(),
  secondsRemaining: z.number().int().nonnegative(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 6. trade:signal
export const tradeSignalSchema = z.object({
  stockCode: z.string(),
  entryPrice: z.number().positive(),
  strategy: z.string(),
  signalType: z.enum(['BUY', 'SELL']),
  timestamp: z.coerce.date().default(() => new Date())
});

// 7. trade:order_update
export const tradeOrderUpdateSchema = z.object({
  orderId: z.string().uuid(),
  brokerOrderId: z.string().nullable().optional(),
  symbol: z.string(),
  status: z.enum(['ORDER_PLACED', 'FILLED', 'PARTIAL', 'REJECTED', 'PENDING', 'COMPLETE', 'CANCELLED']),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  reason: z.string().nullable().optional(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 8. trade:position_update
export const tradePositionUpdateSchema = z.object({
  positionId: z.string().uuid(),
  stockCode: z.string(),
  pnlPct: z.number(),
  currentPrice: z.number().positive(),
  stopLoss: z.number().nonnegative(),
  status: z.string(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 9. trade:exit_triggered
export const tradeExitTriggeredSchema = z.object({
  stockCode: z.string(),
  exitReason: z.string(),
  exitPrice: z.number().positive().nullable().optional(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 10. trade:closed
export const tradeClosedSchema = z.object({
  tradeId: z.string().uuid(),
  stockCode: z.string(),
  finalPnlPct: z.number(),
  exitReason: z.string(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 11. alert:new
export const alertNewSchema = z.object({
  alertId: z.string().uuid().optional(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR']),
  timestamp: z.coerce.date().default(() => new Date())
});

// 12. volume:signal
export const volumeSignalSchema = z.object({
  stockCode: z.string(),
  slotRatio: z.number().nonnegative(),
  cumulativeRatio: z.number().nonnegative(),
  status: z.enum(['BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG', 'WEAK']),
  timestamp: z.coerce.date().default(() => new Date())
});

// 13. system:engine_heartbeat
export const systemEngineHeartbeatSchema = z.object({
  engineName: z.enum(['sector', 'tracked', 'invested']),
  lastRun: z.coerce.date(),
  status: z.enum(['OK', 'ERROR', 'DEGRADED']),
  metadata: z.record(z.any()).nullable().optional(),
  timestamp: z.coerce.date().default(() => new Date())
});

// 14. system:error
export const systemErrorSchema = z.object({
  code: z.string().nullable().optional(),
  message: z.string(),
  source: z.string(),
  timestamp: z.coerce.date().default(() => new Date())
});
