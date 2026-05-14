# WebSocket Implementation Guide: Kite Ticker Handling

This document explains the event flow for real-time market data handling in the "Zero-Thinking Trading System".

## 1. Event Lifecycle (Kite Ticker Flow)

1. **Connection**: Our server (KiteTickerService) connects to Zerodha's WebSocket.
2. **Raw Feed**: Zerodha sends raw binary ticks (`ticker.message`).
3. **Normalization**: `KiteTickerService` parses binary data into a standard JSON format.
4. **Internal Emit**: Service emits `market:tick:received` via the internal `eventBus`.
5. **Handling**: `tickerHandler.js` receives the internal event.
6. **Room Broadcast**: Handler emits `market.tick` to the Socket.IO room `user:{userId}`.
7. **Client Receive**: Frontend receives the real-time tick for UI updates.

---

## 2. Frontend Usage Example (Socket.IO Client)

```javascript
import { io } from "socket.io-client";

// 1. Initialize Connection with JWT
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_ACCESS_TOKEN"
  }
});

// 2. Handle Connection
socket.on("connect", () => {
  console.log("Connected to Realtime Server:", socket.id);
});

// 3. Listen for Live Ticks
socket.on("market.tick", (data) => {
  console.log("Live Market Data Received:", data);
  // Update state/UI
});

// 4. Handle Disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

---

## 3. Server-Side Monitoring (Pino Logs)

- **Connection**: `info: Client connected to WebSocket { socketId, userId }`
- **Ticker Health**: `info: Kite Ticker connected { userId }`
- **Failures**: `error: Kite Ticker error { userId, error }`

---

## 4. Scalability Recommendations

1. **Redis Adapter**: To scale horizontally across multiple backend instances, integrate `@socket.io/redis-adapter`.
2. **Binary Optimization**: For extremely high-frequency data (thousands of ticks/sec), consider using `MessagePack` or `Protocol Buffers` for the Socket.IO payload.
3. **Worker Threads**: Offload the parsing logic of `KiteTickerService` to a Node.js Worker Thread if the event loop becomes congested during peak market volatility.
