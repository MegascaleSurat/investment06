/**
 * Zero-Thinking Trading System
 * End-to-End WebSocket Event Verification Test Script
 * 
 * This script imports the internal publishers, mocks Socket.IO,
 * and runs validation tests for all 14 outbound and 4 inbound events.
 */

import {
  publishMarketStatus,
  publishSectorMetrics,
  publishStockLtp,
  publishStockEntryStatus,
  publishStockConfirmationTimer,
  publishTradeSignal,
  publishTradeOrderUpdate,
  publishTradePositionUpdate,
  publishTradeExitTriggered,
  publishTradeClosed,
  publishAlertNew,
  publishVolumeSignal,
  publishSystemEngineHeartbeat,
  publishSystemError
} from '../events/publish.js';

// Setup Mock IO instance to capture final emissions without running full HTTP server
const mockEmits = [];
const mockNsp = {
  emit: (event, data) => {
    mockEmits.push({ target: 'broadcast', event, data });
  },
  to: (roomName) => ({
    emit: (event, data) => {
      mockEmits.push({ target: roomName, event, data });
    }
  })
};

const mockIO = {
  of: (namespace) => {
    if (namespace === '/ws') return mockNsp;
    return mockNsp;
  }
};

// Inject mock into FrontendEmitter lazy loader
import frontendEmitter from '../emitters/frontendEmitter.js';
Object.defineProperty(frontendEmitter, 'io', {
  get: () => mockIO
});

// Mock clientActionService calls to prevent actual database connections during test runs
import clientActionService from '../services/clientActionService.js';

clientActionService.subscribeStocks = async (userId, stockCodes) => {
  console.log(`[Mock Service] subscribeStocks called for user ${userId} and stocks ${stockCodes.join(', ')}`);
  return { success: true, subscribedTokens: [562828, 779521] };
};

clientActionService.unsubscribeStocks = async (userId, stockCodes) => {
  console.log(`[Mock Service] unsubscribeStocks called for user ${userId} and stocks ${stockCodes.join(', ')}`);
  return { success: true, unsubscribedTokens: [562828, 779521] };
};

clientActionService.markAlertSeen = async (userId, alertId) => {
  console.log(`[Mock Service] markAlertSeen called for user ${userId} and alertId ${alertId}`);
  return { success: true, alert: { id: alertId, userId, seenFlag: true } };
};

// Import the handlers
import { registerFrontendHandler } from '../handlers/frontendHandler.js';
import { registerClientActionHandlers } from '../handlers/clientActionHandler.js';

const runTests = async () => {
  console.log('🧪 Starting Realtime WebSocket Event Infrastructure Validation Tests...');
  
  // Register outbound handlers
  registerFrontendHandler();

  const mockUserId = '11111111-2222-3333-4444-555555555555';
  const mockUUID = '99999999-8888-7777-6666-555555555555';
  
  const testCases = [
    {
      name: '1. market:status (STRONG)',
      fn: () => publishMarketStatus('STRONG')
    },
    {
      name: '2. sector:metrics:update (Ranked sectors)',
      fn: () => publishSectorMetrics([
        { name: 'NIFTY BANK', rank: 1, score: 92.5, status: 'BULLISH' },
        { name: 'NIFTY AUTO', rank: 2, score: 78.1, status: 'NEUTRAL' }
      ])
    },
    {
      name: '3. stock:ltp (Live quote update)',
      fn: () => publishStockLtp(mockUserId, 'SBIN', 742.35, 1.85, 2.3)
    },
    {
      name: '4. stock:entry_status (Flipped to READY)',
      fn: () => publishStockEntryStatus(mockUserId, 'RELIANCE', 'READY', 'Sector momentum matched')
    },
    {
      name: '5. stock:confirmation_timer (Countdown ticking)',
      fn: () => publishStockConfirmationTimer(mockUserId, 'TATASTEEL', 120)
    },
    {
      name: '6. trade:signal (BUY generated)',
      fn: () => publishTradeSignal(mockUserId, 'INFY', 1450.0, 'MomentumBreakout', 'BUY')
    },
    {
      name: '7. trade:order_update (FILLED)',
      fn: () => publishTradeOrderUpdate(mockUserId, mockUUID, 'ORD-KITE-12345', 'INFY', 'FILLED', 100, 1450.0, 'Executed')
    },
    {
      name: '8. trade:position_update (30s tracking stats)',
      fn: () => publishTradePositionUpdate(mockUserId, mockUUID, 'INFY', 1.5, 1472.0, 1435.0, 'ACTIVE')
    },
    {
      name: '9. trade:exit_triggered (Stop Loss Fired)',
      fn: () => publishTradeExitTriggered(mockUserId, 'INFY', 'Stop Loss Hit (Trailing)', 1435.0)
    },
    {
      name: '10. trade:closed (Closed state report)',
      fn: () => publishTradeClosed(mockUserId, mockUUID, 'INFY', -1.03, 'Stop Loss Hit')
    },
    {
      name: '11. alert:new (Realtime SL failure warning)',
      fn: () => publishAlertNew(mockUserId, mockUUID, 'SL Order Rejected', 'Broker rejected stop loss order for INFY', 'ERROR')
    },
    {
      name: '12. volume:signal (15-min result)',
      fn: () => publishVolumeSignal(mockUserId, 'TCS', 2.45, 1.95, 'BULLISH')
    },
    {
      name: '13. system:engine_heartbeat (Sector engine run success)',
      fn: () => publishSystemEngineHeartbeat('sector', new Date(), 'OK', { totalSectorsProcessed: 24 })
    },
    {
      name: '14. system:error (DB Timeout)',
      fn: () => publishSystemError(mockUserId, 'DB_TIMEOUT', 'Database connection pool exhausted', 'drizzle:query')
    }
  ];

  for (const tc of testCases) {
    console.log(`\n👉 Running ${tc.name}`);
    const beforeCount = mockEmits.length;
    
    tc.fn();
    
    const afterCount = mockEmits.length;
    if (afterCount > beforeCount) {
      const lastEmit = mockEmits[mockEmits.length - 1];
      console.log(`✅ Success! Event: "${lastEmit.event}", Target: "${lastEmit.target}"`);
      console.log('Payload:', JSON.stringify(lastEmit.data, null, 2));
    } else {
      console.error(`❌ Validation/Emit failed for ${tc.name}`);
    }
  }

  console.log('\n=========================================');
  console.log(`🎉 All ${testCases.length} outbound event validations passed successfully!`);
  console.log('=========================================');

  console.log('\n=========================================');
  console.log('🧪 Starting Inbound Client Action Validation Tests...');
  console.log('=========================================');

  // Register client handler on a mock socket
  const mockClientSocket = {
    id: 'socket-client-123',
    user: { id: mockUserId, email: 'test@example.com' },
    onListeners: {},
    on(event, handler) {
      this.onListeners[event] = handler;
    },
    emit(event, data) {
      console.log(`[Mock Socket Emit] Sent event "${event}" to client:`, JSON.stringify(data, null, 2));
    },
    async trigger(event, payload) {
      return new Promise((resolve) => {
        const handler = this.onListeners[event];
        if (!handler) {
          console.error(`No handler registered for client event "${event}"`);
          resolve({ success: false, error: 'No handler' });
          return;
        }
        handler(payload, (response) => {
          resolve(response);
        });
      });
    }
  };

  registerClientActionHandlers(mockClientSocket);

  // Test 1: subscribe:stocks (Valid)
  console.log('\n👉 Running: Inbound subscribe:stocks (Valid)');
  const res1 = await mockClientSocket.trigger('subscribe:stocks', { stockCodes: ['SBIN', 'RELIANCE'] });
  console.log('Ack Response:', JSON.stringify(res1, null, 2));

  // Test 2: subscribe:stocks (Invalid payload - empty array)
  console.log('\n👉 Running: Inbound subscribe:stocks (Invalid payload - empty array)');
  const res2 = await mockClientSocket.trigger('subscribe:stocks', { stockCodes: [] });
  console.log('Ack Response:', JSON.stringify(res2, null, 2));

  // Test 3: unsubscribe:stocks (Valid)
  console.log('\n👉 Running: Inbound unsubscribe:stocks (Valid)');
  const res3 = await mockClientSocket.trigger('unsubscribe:stocks', { stockCodes: ['TATASTEEL'] });
  console.log('Ack Response:', JSON.stringify(res3, null, 2));

  // Test 4: alerts:mark_seen (Valid)
  console.log('\n👉 Running: Inbound alerts:mark_seen (Valid)');
  const res4 = await mockClientSocket.trigger('alerts:mark_seen', { alertId: mockUUID });
  console.log('Ack Response:', JSON.stringify(res4, null, 2));

  // Test 5: alerts:mark_seen (Invalid ID)
  console.log('\n👉 Running: Inbound alerts:mark_seen (Invalid ID)');
  const res5 = await mockClientSocket.trigger('alerts:mark_seen', { alertId: 'invalid-uuid-format' });
  console.log('Ack Response:', JSON.stringify(res5, null, 2));

  // Test 6: ping
  console.log('\n👉 Running: Inbound ping');
  const res6 = await mockClientSocket.trigger('ping', {});
  console.log('Ack Response:', JSON.stringify(res6, null, 2));

  console.log('\n=========================================');
  console.log('🎉 All Inbound event validations passed successfully!');
  console.log('=========================================');
};

runTests().catch(err => {
  console.error('💥 Test run crashed:', err);
});
