import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { tradeOrders } from '../../db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * reconcileOrdersProcessor
 * 
 * Runs every 5 min during market hours.
 * Fetches today's orders from Kite REST API.
 * Compares with trade_orders table — detects orders that changed
 * state outside our WebSocket feed (rejections, partial fills, etc.)
 * and updates DB to match broker truth.
 */
export const reconcileOrdersProcessor = async (job) => {
  const { userId } = job.data;
  const jobId = job.id;

  logger.info({ jobId, userId }, '[reconcileOrders] Job started');

  // 1. Fetch live orders from Kite
  const kc = await kiteService._getKiteInstance(userId);
  const brokerOrders = await kc.getOrders();

  if (!brokerOrders || brokerOrders.length === 0) {
    logger.info({ jobId }, '[reconcileOrders] No broker orders found today');
    return { success: true, reconciled: 0 };
  }

  // 2. Build map of broker orders: order_id → status
  const brokerMap = {};
  for (const o of brokerOrders) {
    brokerMap[o.order_id] = {
      status: o.status,
      filledQty: o.filled_quantity,
      avgPrice: o.average_price,
      rejectedReason: o.status_message
    };
  }

  // 3. Fetch all pending/open orders from our DB for this user
  const dbOrders = await db.select({
    id: tradeOrders.id,
    brokerOrderId: tradeOrders.brokerOrderId,
    status: tradeOrders.status
  })
  .from(tradeOrders)
  .where(
    and(
      eq(tradeOrders.userId, userId),
      inArray(tradeOrders.status, ['OPEN', 'TRIGGER_PENDING', 'AMO_REQ_RECEIVED'])
    )
  );

  let reconciled = 0;

  // 4. Compare and fix mismatches
  for (const dbOrder of dbOrders) {
    const broker = brokerMap[dbOrder.brokerOrderId];
    if (!broker) continue;

    // If broker status differs from our DB — update
    if (broker.status !== dbOrder.status) {
      await db.update(tradeOrders)
        .set({
          status: broker.status,
          filledQty: broker.filledQty || 0,
          avgPrice: String(broker.avgPrice || 0),
          rejectedReason: broker.rejectedReason,
          updatedAt: new Date()
        })
        .where(eq(tradeOrders.id, dbOrder.id));

      logger.warn({
        jobId,
        userId,
        brokerOrderId: dbOrder.brokerOrderId,
        dbStatus: dbOrder.status,
        brokerStatus: broker.status
      }, '[reconcileOrders] Status mismatch fixed');

      reconciled++;
    }
  }

  logger.info({ jobId, reconciled }, '[reconcileOrders] Completed');
  return { success: true, reconciled };
};
