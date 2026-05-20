import { db } from '../../db/index.js';
import { 
  alerts, 
  notifications, 
  engineState, 
  tradeLogs 
} from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import logger from '../../config/logger.js';
import kiteTickerService from '../../modules/websocket/services/KiteTickerService.js';

// In-memory cache to deduplicate alerts (expires in 5 minutes)
const recentAlertsCache = new Map();
const ALERT_DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000;

class AlertNotificationService {
  /**
   * 1. Dispatch Alert
   * Writes alert to DB, publishes to frontend, and handles deduplication
   */
  async dispatchAlert(alertData) {
    const { userId, alertName, conditionType, conditionConfig } = alertData;
    
    // Generate a deduplication key
    const cacheKey = `${userId}:${alertName}:${JSON.stringify(conditionConfig)}`;
    const now = Date.now();
    
    if (recentAlertsCache.has(cacheKey)) {
      const lastDispatched = recentAlertsCache.get(cacheKey);
      if (now - lastDispatched < ALERT_DEDUPLICATION_WINDOW_MS) {
        logger.debug({ userId, alertName }, 'Alert suppressed by deduplication filter');
        return { success: true, status: 'DEDUPLICATED' };
      }
    }
    
    recentAlertsCache.set(cacheKey, now);

    try {
      // 1. Write to alerts table
      const [newAlert] = await db.insert(alerts)
        .values({
          userId,
          alertName,
          conditionType,
          conditionConfig,
          isActive: true,
          seenFlag: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Write to notifications table for persistent feed
      const [newNotification] = await db.insert(notifications)
        .values({
          userId,
          title: `Alert: ${alertName}`,
          message: conditionConfig.message || `System triggered alert of type ${conditionType}`,
          type: conditionConfig.severity || 'WARNING',
          isRead: false,
          metadata: conditionConfig,
          createdAt: new Date(),
        })
        .returning();

      // 3. Push to frontend via Socket.IO
      try {
        const { getIO } = await import('../../modules/websocket/index.js');
        const io = getIO();
        if (io) {
          const userRoom = `user:${userId}`;
          io.to(userRoom).emit('alert:new', {
            alert: newAlert,
            notification: newNotification
          });
        }
      } catch (ioErr) {
        logger.debug('Socket.IO instance not initialized yet, skipping WS emit');
      }

      logger.info({ alertId: newAlert.id, alertName }, 'Alert dispatched and saved');
      return { success: true, status: 'DISPATCHED', alertId: newAlert.id };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to dispatch alert');
      throw error;
    }
  }

  /**
   * 2. Check Engine Heartbeats
   * Validates if engines have updated their heartbeats within 120s
   */
  async checkEngineHeartbeats() {
    logger.info('[HeartbeatWorker] Checking trading engines health heartbeats...');
    
    const engines = ['sector', 'tracked', 'invested', 'exit'];
    const now = Date.now();

    for (const engineName of engines) {
      try {
        const [state] = await db.select()
          .from(engineState)
          .where(eq(engineState.engineName, engineName))
          .limit(1);

        // If no record exists, initialize it
        if (!state) {
          await db.insert(engineState).values({
            engineName,
            status: 'IDLE',
            isPaused: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          continue;
        }

        if (state.isPaused) {
          logger.debug({ engineName }, 'Engine is paused, skipping heartbeat check');
          continue;
        }

        const heartbeatTime = state.heartbeatAt ? new Date(state.heartbeatAt).getTime() : 0;
        const missingIntervals = now - heartbeatTime > 120000; // > 2 intervals of 60s

        if (missingIntervals && state.status !== 'CRASHED') {
          logger.error({ engineName, lastHeartbeat: state.heartbeatAt }, `❌ Engine ${engineName} heartbeat missing! Marking as CRASHED.`);

          // Update DB state
          await db.update(engineState)
            .set({
              status: 'CRASHED',
              updatedAt: new Date()
            })
            .where(eq(engineState.engineName, engineName));

          // Find all users with active broker configurations to notify
          const credentials = await db.select({ userId: sql`distinct user_id` }).from(alerts).limit(10); // Proxy fallback
          const usersToNotify = credentials.map(c => c.userId);

          // Standard default fallback if empty
          if (usersToNotify.length === 0) {
            const [firstUser] = await db.execute(sql`SELECT id FROM users LIMIT 1`);
            if (firstUser) usersToNotify.push(firstUser.id);
          }

          for (const uId of usersToNotify) {
            await this.dispatchAlert({
              userId: uId,
              alertName: 'ENGINE_CRASHED',
              conditionType: 'HEARTBEAT_MISSING',
              conditionConfig: {
                engineName,
                message: `Critical Error: Trading Engine "${engineName}" has stopped reporting heartbeats.`,
                severity: 'CRITICAL',
                lastHeartbeat: state.heartbeatAt
              }
            });
          }
        }
      } catch (err) {
        logger.error({ engineName, error: err.message }, 'Failed to check heartbeat for engine');
      }
    }

    return { success: true };
  }

  /**
   * Helper to write heartbeat for an engine
   */
  async recordHeartbeat(engineName) {
    await db.insert(engineState)
      .values({
        engineName,
        heartbeatAt: new Date(),
        status: 'RUNNING',
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: engineState.engineName,
        set: {
          heartbeatAt: new Date(),
          status: 'RUNNING',
          updatedAt: new Date()
        }
      });

    // Broadcast system engine heartbeat via websockets
    try {
      const { getIO } = await import('../../modules/websocket/index.js');
      const io = getIO();
      if (io) {
        io.emit('system:engine_heartbeat', {
          engineName,
          status: 'RUNNING',
          timestamp: new Date()
        });
      }
    } catch (e) {
      // Ignored
    }
  }

  /**
   * 3. Reconnect Kite Ticker
   * Reconnects with exponential backoff and raises alert after 5 failures
   */
  async reconnectKite(userId, attempt = 1) {
    logger.info({ userId, attempt }, 'Initiating automatic Kite Ticker reconnect...');

    try {
      await kiteTickerService.connect(userId);
      logger.info({ userId }, 'Kite Ticker successfully reconnected');
      return { success: true, status: 'RECONNECTED' };
    } catch (err) {
      logger.warn({ userId, attempt, error: err.message }, 'Kite Ticker reconnect attempt failed');

      if (attempt < 5) {
        const nextAttempt = attempt + 1;
        const delayMs = Math.min(Math.pow(2, attempt - 1) * 1000, 30000);
        logger.info({ userId, nextAttempt, delayMs }, 'Scheduling next reconnection retry');

        const { queueReconnectKiteJob } = await import('../producers/alertNotification.producer.js');
        await queueReconnectKiteJob(userId, nextAttempt, delayMs);
        
        return { success: true, status: 'RETRY_SCHEDULED', nextAttempt, delayMs };
      } else {
        logger.error({ userId }, 'Kite Ticker reconnect completely failed after 5 attempts');

        // Create critical alarm
        await this.dispatchAlert({
          userId,
          alertName: 'KITE_CONNECTION_FAILED',
          conditionType: 'DISCONNECT',
          conditionConfig: {
            message: 'Critical: Kite WebSocket reconnection failed permanently after 5 consecutive attempts. Action required.',
            severity: 'CRITICAL',
            attempts: 5
          }
        });

        // Pause engines
        try {
          const { default: maintenanceService } = await import('../../modules/maintenance/maintenance.service.js');
          if (maintenanceService && typeof maintenanceService.pauseAllEngines === 'function') {
            await maintenanceService.pauseAllEngines(userId, 'Permanent Kite WebSocket disconnect (5 reconnection failures)');
          }
        } catch (e) {
          logger.warn('Failed to import maintenanceService to pause engines');
        }

        return { success: false, status: 'FAILED_PERMANENTLY' };
      }
    }
  }

  /**
   * 4. Write Trade Log
   * Async database write operation to prevent write contention
   */
  async writeTradeLog(logData) {
    const { tradeId, logType, message, metadata } = logData;
    
    try {
      const [newLog] = await db.insert(tradeLogs)
        .values({
          tradeId,
          logType,
          message,
          metadata: metadata || null,
          createdAt: new Date(),
        })
        .returning();

      logger.debug({ logId: newLog.id, tradeId }, 'Trade log written asynchronously');
      return { success: true, logId: newLog.id };
    } catch (error) {
      logger.error({ error: error.message, tradeId }, 'Failed to write trade log');
      throw error;
    }
  }
}

export default new AlertNotificationService();
